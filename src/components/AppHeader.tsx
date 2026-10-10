import { Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Logo } from "./Logo";
import { Crown, LogOut, User, Globe } from "lucide-react";
import { ADMIN_EMAIL, useActivePlan } from "@/lib/subscription";
import { useLanguage, UI_TEXT } from "@/lib/i18n";

export function AppHeader() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [lang, setLang] = useLanguage();
  const isEn = lang === "en";

  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      const email = data.user?.email || localStorage.getItem("reportix_user_email") || null;
      const name =
        data.user?.user_metadata?.full_name ||
        data.user?.user_metadata?.name ||
        localStorage.getItem("reportix_user_name") ||
        null;
      setUserEmail(email);
      setUserName(name);
    });
  }, []);

  const activePlan = useActivePlan(userEmail);
  const isAdmin = Boolean(ADMIN_EMAIL) && userEmail?.toLowerCase() === ADMIN_EMAIL.toLowerCase();

  const signOut = async () => {
    await qc.cancelQueries();
    qc.clear();
    localStorage.removeItem("reportix_admin_auth");
    localStorage.removeItem("reportix_user_email");
    localStorage.removeItem("reportix_user_name");
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  };

  const link =
    "rounded-md px-3 py-1.5 text-sm text-zinc-400 transition-colors hover:text-white";

  const t = UI_TEXT[lang].nav;

  return (
    <header className="sticky top-0 z-20 border-b border-zinc-800/80 bg-background/85 backdrop-blur-md print:hidden">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-6 px-6">
        <Link to="/new">
          <Logo />
        </Link>
        <nav className="flex items-center gap-1.5">
          <Link
            to="/new"
            className={link}
            activeProps={{ className: "text-white bg-zinc-800/90 border border-zinc-700/60 shadow-sm shadow-black/40 font-medium" }}
          >
            {t.create}
          </Link>
          <Link
            to="/reports"
            className={link}
            activeProps={{ className: "text-white bg-zinc-800/90 border border-zinc-700/60 shadow-sm shadow-black/40 font-medium" }}
          >
            {t.history}
          </Link>
          <Link
            to="/pricing"
            className={link}
            activeProps={{ className: "text-white bg-zinc-800/90 border border-zinc-700/60 shadow-sm shadow-black/40 font-medium" }}
          >
            {t.pricing}
          </Link>
          <Link
            to="/guide"
            className={link}
            activeProps={{ className: "text-white bg-zinc-800/90 border border-zinc-700/60 shadow-sm shadow-black/40 font-medium" }}
          >
            {t.guide}
          </Link>
          <Link
            to="/demo"
            className={`${link} hidden md:inline-flex text-zinc-400 hover:text-emerald-300`}
            activeProps={{ className: "text-emerald-400 bg-zinc-800/90 border border-emerald-500/30 font-medium" }}
          >
            {t.demo}
          </Link>
        </nav>

        <div className="ml-auto flex items-center gap-3">
          {/* Language Switcher RU / EN */}
          <button
            type="button"
            onClick={() => setLang(isEn ? "ru" : "en")}
            className="flex items-center gap-1 rounded-lg border border-zinc-800 bg-zinc-900/80 px-2 py-1 text-xs font-semibold text-zinc-300 hover:border-zinc-700 hover:text-white transition"
            title={isEn ? "Switch to Russian" : "Переключить на English"}
          >
            <Globe className="h-3 w-3 text-zinc-400" />
            <span className={!isEn ? "text-white font-bold" : "text-zinc-500"}>RU</span>
            <span className="text-zinc-600">/</span>
            <span className={isEn ? "text-white font-bold" : "text-zinc-500"}>EN</span>
          </button>

          {/* User Name & Plan Badge */}
          {userName && (
            <div className="hidden sm:flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900/80 px-3 py-1 text-xs text-zinc-300">
              <User className="h-3 w-3 text-zinc-400" />
              <span className="font-medium text-white">{userName}</span>
              <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                activePlan.plan.id === 'pro' || isAdmin
                  ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                  : 'bg-zinc-800 text-zinc-400'
              }`}>
                {isAdmin ? 'PRO' : (isEn ? activePlan.plan.id.toUpperCase() : activePlan.plan.name)}
              </span>
            </div>
          )}

          {isAdmin && (
            <Link to="/admin">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/50 bg-amber-500/15 px-3 py-1 text-xs font-bold text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.25)] hover:bg-amber-500/25 transition-all">
                <Crown className="h-3.5 w-3.5 text-amber-400" /> {t.admin}
              </span>
            </Link>
          )}

          <button
            onClick={signOut}
            className={`${link} inline-flex items-center gap-1.5 hover:text-zinc-200`}
            title={t.logout}
          >
            <LogOut className="h-4 w-4" /> <span className="hidden sm:inline">{t.logout}</span>
          </button>
        </div>
      </div>
    </header>
  );
}
