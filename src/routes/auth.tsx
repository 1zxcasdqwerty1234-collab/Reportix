import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ArrowRight, LockKeyhole, Mail, ShieldAlert, User, Globe } from "lucide-react";
import { useLanguage } from "@/lib/i18n";
import { supabase } from "@/integrations/supabase/client";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ADMIN_DEFAULT_PASSWORD, ADMIN_EMAIL } from "@/lib/subscription";
import { logActivity } from "@/lib/support";
import {
  checkAccountCreationLimit,
  getClientIp,
  recordAccountRegistration,
  MAX_ACCOUNTS_PER_IP,
} from "@/lib/security";

type AuthMode = "signin" | "signup";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Вход — Reportix" },
      { name: "description", content: "Вход и регистрация в Reportix по email и паролю." },
      { property: "og:title", content: "Вход — Reportix" },
      { property: "og:description", content: "Вход и регистрация по email и паролю." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const [lang, setLang] = useLanguage();
  const isEn = lang === "en";
  const navigate = useNavigate();
  const [mode, setMode] = useState<AuthMode>("signin");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [recoveryMode, setRecoveryMode] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;
    const isPasswordReset = new URLSearchParams(window.location.search).get("password-reset") === "1";
    const { data: authListener } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setRecoveryMode(true);
    });
    supabase.auth.getSession().then(({ data }) => {
      if (!active || !data.session) return;
      if (isPasswordReset) setRecoveryMode(true);
      else navigate({ to: "/new", replace: true });
    });
    return () => {
      active = false;
      authListener.subscription.unsubscribe();
    };
  }, [navigate]);

  const sendPasswordReset = async () => {
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) {
      toast.error("Сначала укажите email");
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(normalizedEmail, {
        redirectTo: `${window.location.origin}/auth?password-reset=1`,
      });
      if (error) throw error;
      toast.success("Если аккаунт существует, письмо для смены пароля уже отправлено");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Не удалось отправить письмо");
    } finally {
      setLoading(false);
    }
  };

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    const normalizedEmail = email.trim().toLowerCase();
    const clientIp = getClientIp();

    // Admin shortcut only if BOTH env vars are set — never blocks normal users
    const isAdminCreds = Boolean(
      ADMIN_EMAIL &&
      ADMIN_DEFAULT_PASSWORD &&
      normalizedEmail === ADMIN_EMAIL.toLowerCase() &&
      password === ADMIN_DEFAULT_PASSWORD
    );

    try {
      if (recoveryMode) {
        const { error } = await supabase.auth.updateUser({ password });
        if (error) throw error;
        toast.success("Пароль обновлён");
        await navigate({ to: "/new", replace: true });
        return;
      }

      if (mode === "signin") {
        let authSuccess = false;
        let lastErrorMsg = "";

        try {
          const { data: signInData, error } = await supabase.auth.signInWithPassword({
            email: normalizedEmail,
            password,
          });
          if (!error && signInData.session) {
            authSuccess = true;
            if (signInData.user?.user_metadata?.full_name) {
              localStorage.setItem("reportix_user_name", signInData.user.user_metadata.full_name);
            }
          } else if (error) {
            lastErrorMsg = error.message || "";
            // Admin bootstrap: create admin account in Supabase if env creds match
            if (isAdminCreds) {
              const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
                email: normalizedEmail,
                password,
                options: { data: { full_name: "Admin" } },
              });
              if (!signUpError && signUpData.session) {
                authSuccess = true;
              } else if (signUpError) {
                lastErrorMsg = signUpError.message || lastErrorMsg;
              }
            }
          }
        } catch (err) {
          lastErrorMsg = err instanceof Error ? err.message : "Ошибка сети";
        }

        if (isAdminCreds && authSuccess) {
          localStorage.setItem("reportix_admin_auth", "true");
          localStorage.setItem("reportix_user_email", normalizedEmail);
          localStorage.setItem("reportix_user_name", "Admin");
        } else if (authSuccess) {
          localStorage.setItem("reportix_user_email", normalizedEmail);
        }

        if (!authSuccess) {
          // Show real reason — helps debug wrong Supabase keys / confirm email / bad password
          const msg = lastErrorMsg.toLowerCase();
          if (msg.includes("invalid login") || msg.includes("invalid credentials") || msg.includes("wrong")) {
            toast.error("Неверный email или пароль");
          } else if (msg.includes("email not confirmed") || msg.includes("not confirmed")) {
            toast.error("Email не подтверждён. Отключите Confirm email в Supabase → Auth → Providers → Email");
          } else if (msg.includes("fetch") || msg.includes("network") || msg.includes("failed")) {
            toast.error("Не удаётся связаться с сервером авторизации. Проверьте ключи Supabase в .env");
          } else if (lastErrorMsg) {
            toast.error(lastErrorMsg);
          } else {
            toast.error("Неверный email или пароль");
          }
          return;
        }

        logActivity(
          normalizedEmail,
          "Вход в аккаунт",
          isAdminCreds ? "Вход администратора" : "Успешный вход пользователя",
          clientIp
        );
        toast.success(isAdminCreds ? "Вход выполнен (админ)" : "Вы вошли в аккаунт");
        await navigate({ to: isAdminCreds ? "/admin" : "/new", replace: true });
        return;
      }

      // REGISTRATION WITH NAME VALIDATION AND STRICT IP LIMIT (MAX 3 ACCOUNTS PER IP)
      if (mode === "signup") {
        // Name is optional-ish: min 2 chars, any language
        const trimmedName = fullName.trim();
        if (!trimmedName || trimmedName.length < 2) {
          toast.error("Укажите имя (минимум 2 символа)");
          return;
        }

        // 2. IP Rate Limit check (max 3 accounts per IP)
        const limitCheck = checkAccountCreationLimit(clientIp);
        if (!limitCheck.allowed) {
          toast.error(
            limitCheck.message ||
              `Превышен лимит создания аккаунтов (максимум ${MAX_ACCOUNTS_PER_IP} с одного IP). Абуз системы запрещён.`,
            { duration: 8000 }
          );
          logActivity(
            normalizedEmail,
            "Блокировка регистрации (Лимит IP)",
            `Попытка создания превышающего аккаунта с IP: ${clientIp}`,
            clientIp
          );
          return;
        }

        const { data, error } = await supabase.auth.signUp({
          email: normalizedEmail,
          password,
          options: {
            data: {
              full_name: trimmedName,
              name: trimmedName,
            },
          },
        });
        if (error) {
          toast.error(
            error.message.includes("User already registered")
              ? "Этот email уже зарегистрирован. Войдите в аккаунт."
              : error.message
          );
          return;
        }

        if (!data.session) {
          toast.error(
            "В настройках Supabase включено подтверждение email. Отключите Auth → Sign In / Providers → Email → Confirm email в панели проекта.",
            { duration: 9000 }
          );
          return;
        }

        // Record successful IP registration & User details
        recordAccountRegistration(clientIp, normalizedEmail);
        localStorage.setItem("reportix_user_email", normalizedEmail);
        localStorage.setItem("reportix_user_name", trimmedName);

        // Record real user on server
        fetch("/api/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: normalizedEmail,
            fullName: trimmedName,
            ip: clientIp,
            planId: "free",
          }),
        }).catch(() => {});

        logActivity(
          normalizedEmail,
          "Регистрация аккаунта",
          `Успешная регистрация реального пользователя ${trimmedName} с IP: ${clientIp}`,
          clientIp
        );
        toast.success(`Аккаунт создан! Добро пожаловать, ${trimmedName}!`);
        await navigate({ to: "/new", replace: true });
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Не удалось выполнить вход. Попробуйте ещё раз.");
    } finally {
      setLoading(false);
    }
  };

  const isSignup = mode === "signup";

  return (
    <div className="auth-page relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6 py-12 bg-background text-foreground">
      <div className="pointer-events-none absolute inset-0 bg-grid" />
      <div className="animate-glow pointer-events-none absolute left-1/2 top-1/3 h-80 w-80 -translate-x-1/2 rounded-full bg-white/[0.08] blur-3xl" />
      <Link to="/" className="relative mb-10 animate-fade-up transition-transform duration-300 hover:scale-[1.03]">
        <Logo size="lg" />
      </Link>
      <div key={mode} className="auth-card relative w-full max-w-sm animate-scale-in rounded-2xl border border-zinc-800 bg-card p-8 shadow-2xl shadow-black/80">
        {/* Language switch */}
        <div className="mb-4 flex justify-end">
          <button
            type="button"
            onClick={() => setLang(isEn ? "ru" : "en")}
            className="flex items-center gap-1 rounded-lg border border-zinc-800 bg-zinc-900/80 px-2 py-1 text-[11px] font-semibold text-zinc-300 hover:border-zinc-700 hover:text-white transition"
          >
            <Globe className="h-3 w-3 text-zinc-400" />
            <span className={!isEn ? "text-white font-bold" : "text-zinc-500"}>RU</span>
            <span className="text-zinc-600">/</span>
            <span className={isEn ? "text-white font-bold" : "text-zinc-500"}>EN</span>
          </button>
        </div>

        {!recoveryMode && (
          <div className="mb-6 flex rounded-xl border border-zinc-800 bg-zinc-900/90 p-1" role="tablist" aria-label="Режим авторизации">
            <button
              type="button"
              role="tab"
              aria-selected={!isSignup}
              onClick={() => setMode("signin")}
              className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-300 ${
                !isSignup ? "bg-zinc-800 text-white shadow-sm font-semibold" : "text-zinc-400 hover:text-white"
              }`}
            >
              {isEn ? "Sign in" : "Вход"}
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={isSignup}
              onClick={() => setMode("signup")}
              className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-300 ${
                isSignup ? "bg-zinc-800 text-white shadow-sm font-semibold" : "text-zinc-400 hover:text-white"
              }`}
            >
              {isEn ? "Sign up" : "Регистрация"}
            </button>
          </div>
        )}

        <h1 className="text-2xl font-semibold tracking-tight text-white">
          {recoveryMode ? "Новый пароль" : isSignup ? "Создайте аккаунт" : "С возвращением"}
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-zinc-400">
          {recoveryMode
            ? "Придумайте новый пароль для доступа к своим отчётам."
            : isSignup
              ? "Зарегистрируйтесь, чтобы создавать и хранить отчёты."
              : "Войдите, чтобы продолжить работу с отчётами."}
        </p>

        {isSignup && (
          <div className="mt-4 flex items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900/60 p-2.5 text-[11px] text-zinc-400">
            <ShieldAlert className="h-4 w-4 shrink-0 text-amber-400" />
            <span>Защита: лимит до {MAX_ACCOUNTS_PER_IP} аккаунтов с одного IP. Имя только на английском.</span>
          </div>
        )}

        <form onSubmit={submit} className="mt-5 space-y-4">
          {isSignup && !recoveryMode && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="fullName" className="text-zinc-200">Имя</Label>
                <span className="text-[11px] text-zinc-400 font-mono">English, min 4 letters</span>
              </div>
              <div className="relative">
                <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                <Input
                  id="fullName"
                  type="text"
                  autoComplete="name"
                  required
                  minLength={4}
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. John Doe"
                  className="h-11 border-zinc-800 bg-zinc-900/60 pl-9 text-white placeholder:text-zinc-500 focus-visible:ring-zinc-400 transition-shadow duration-200 focus-visible:ring-2"
                />
              </div>
              <p className="text-[11px] text-zinc-500">Как к вам обращаться</p>
            </div>
          )}

          {!recoveryMode && (
            <div className="space-y-2">
              <Label htmlFor="email" className="text-zinc-200">Email</Label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@agency.ru"
                  className="h-11 border-zinc-800 bg-zinc-900/60 pl-9 text-white placeholder:text-zinc-500 focus-visible:ring-zinc-400 transition-shadow duration-200 focus-visible:ring-2"
                />
              </div>
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="password" className="text-zinc-200">{recoveryMode ? "Новый пароль" : "Пароль"}</Label>
            <div className="relative">
              <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
              <Input
                id="password"
                type="password"
                autoComplete={isSignup || recoveryMode ? "new-password" : "current-password"}
                minLength={isSignup || recoveryMode ? 8 : undefined}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={isSignup || recoveryMode ? "Не менее 8 символов" : "Ваш пароль"}
                className="h-11 border-zinc-800 bg-zinc-900/60 pl-9 text-white placeholder:text-zinc-500 focus-visible:ring-zinc-400 transition-shadow duration-200 focus-visible:ring-2"
              />
            </div>
            {(isSignup || recoveryMode) && <p className="text-xs text-zinc-400">Используйте не менее 8 символов.</p>}
          </div>
          <Button
            type="submit"
            className="auth-submit group mt-2 h-11 w-full bg-gradient-to-r from-zinc-100 via-white to-zinc-200 text-zinc-950 font-semibold shadow-[0_0_20px_rgba(255,255,255,0.25)] hover:from-white hover:to-zinc-100 hover:shadow-[0_0_30px_rgba(255,255,255,0.4)] transition-all duration-300 hover:-translate-y-0.5"
            disabled={loading}
          >
            {loading ? "Подождите…" : recoveryMode ? "Сохранить пароль" : isSignup ? "Создать аккаунт" : "Войти"}
            {!loading && <ArrowRight className="ml-1 h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />}
          </Button>
        </form>
        {!recoveryMode && !isSignup && (
          <button
            type="button"
            onClick={sendPasswordReset}
            disabled={loading}
            className="mt-4 w-full text-center text-xs text-zinc-400 transition-colors hover:text-white disabled:opacity-60"
          >
            Забыли пароль?
          </button>
        )}
        {!recoveryMode && (
          <p className="mt-5 text-center text-xs leading-relaxed text-zinc-500">
            {isSignup
              ? "После регистрации можно сразу начать работу. Код подтверждения на почту будет подключен при выкатке на хостинг."
              : "Вход защищён вашим паролем. Доступ к аккаунту мгновенный."}
          </p>
        )}
      </div>
      <Link to="/" className="relative mt-6 text-xs text-zinc-400 transition-colors hover:text-white">
        Вернуться на главную
      </Link>
    </div>
  );
}
