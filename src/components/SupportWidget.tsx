import { useEffect, useState } from "react";
import { MessageSquare, Send, CheckCircle2, Clock, X, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { createSupportTicket, fetchUserTickets, type SupportTicket } from "@/lib/support";
import { ADMIN_EMAIL } from "@/lib/subscription";

export function SupportWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState<"tech" | "billing" | "feature" | "other">("tech");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [activeTab, setActiveTab] = useState<"create" | "history">("create");
  const [tickets, setTickets] = useState<SupportTicket[]>([]);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      const email = data.user?.email || localStorage.getItem("reportix_user_email") || "";
      if (email) {
        setUserEmail(email);
        loadTickets(email);
      }
    });
  }, [isOpen]);

  const loadTickets = async (email: string) => {
    if (!email) return;
    try {
      const userTickets = await fetchUserTickets(email);
      setTickets(userTickets);
    } catch {
      // ignore
    }
  };

  const handleOpen = () => {
    setIsOpen(true);
    if (userEmail) loadTickets(userEmail);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userEmail.trim()) {
      toast.error("Укажите ваш email для получения ответа");
      return;
    }
    if (!subject.trim() || !message.trim()) {
      toast.error("Заполните тему и текст обращения");
      return;
    }

    setSending(true);
    try {
      await createSupportTicket({
        userEmail,
        subject,
        category,
        message,
      });
      toast.success("Обращение отправлено! Администратор ответит вам в ближайшее время.");
      setSubject("");
      setMessage("");
      loadTickets(userEmail);
      setActiveTab("history");
    } catch (e: any) {
      toast.error("Не удалось отправить обращение. Попробуйте еще раз.");
    } finally {
      setSending(false);
    }
  };

  const repliedTicketsCount = tickets.filter((t) => t.adminReply && t.status !== "resolved").length;

  return (
    <>
      {/* Floating Trigger Button */}
      <button
        onClick={handleOpen}
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2 rounded-full border border-zinc-700 bg-zinc-900/95 px-4 py-2.5 text-xs font-semibold text-zinc-100 shadow-2xl shadow-black/90 backdrop-blur-md transition-all duration-300 hover:border-zinc-500 hover:text-white hover:scale-105 hover:shadow-[0_0_20px_rgba(255,255,255,0.2)] cursor-pointer"
        aria-label="Поддержка"
      >
        <span className="relative flex items-center justify-center">
          <MessageSquare className="h-4 w-4 text-emerald-400" />
          {repliedTicketsCount > 0 && (
            <span className="absolute -top-1 -right-1.5 h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
          )}
        </span>
        <span>Поддержка</span>
      </button>

      {/* Support Modal Drawer */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 p-4 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-lg rounded-2xl border border-zinc-800 bg-card p-6 shadow-2xl shadow-black text-foreground max-h-[90vh] flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="grid h-8 w-8 place-items-center rounded-lg bg-zinc-800 text-zinc-300 border border-zinc-700">
                  <HelpCircle className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white leading-tight">Служба поддержки Reportix</h3>
                  <p className="text-[11px] text-zinc-400">Прямая связь с главным администратором</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-zinc-800 mt-3">
              <button
                onClick={() => setActiveTab("create")}
                className={`flex-1 py-2 text-xs font-semibold border-b-2 transition-colors ${
                  activeTab === "create"
                    ? "border-white text-white"
                    : "border-transparent text-zinc-400 hover:text-zinc-200"
                }`}
              >
                Новое обращение
              </button>
              <button
                onClick={() => {
                  setActiveTab("history");
                  if (userEmail) loadTickets(userEmail);
                }}
                className={`flex-1 py-2 text-xs font-semibold border-b-2 transition-colors flex items-center justify-center gap-1.5 ${
                  activeTab === "history"
                    ? "border-white text-white"
                    : "border-transparent text-zinc-400 hover:text-zinc-200"
                }`}
              >
                <span>Мои тикеты</span>
                {tickets.length > 0 && (
                  <span className="rounded-full bg-zinc-800 px-1.5 py-0.2 text-[10px] text-zinc-300">
                    {tickets.length}
                  </span>
                )}
              </button>
            </div>

            {/* Tab 1: Create Ticket Form */}
            {activeTab === "create" && (
              <form onSubmit={handleSubmit} className="mt-4 space-y-3.5 overflow-y-auto pr-1">
                <div>
                  <Label htmlFor="tkt-email" className="text-xs text-zinc-300">Ваш Email для ответа</Label>
                  <Input
                    id="tkt-email"
                    type="email"
                    required
                    value={userEmail}
                    onChange={(e) => setUserEmail(e.target.value)}
                    placeholder="you@agency.ru"
                    className="mt-1 h-9 border-zinc-800 bg-zinc-900 text-xs text-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <Label htmlFor="tkt-cat" className="text-xs text-zinc-300">Категория</Label>
                    <select
                      id="tkt-cat"
                      value={category}
                      onChange={(e) => setCategory(e.target.value as any)}
                      className="mt-1 w-full h-9 rounded-md border border-zinc-800 bg-zinc-900 px-2.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-zinc-400"
                    >
                      <option value="tech">Технический сбой</option>
                      <option value="billing">Вопрос по тарифам</option>
                      <option value="feature">Пожелание / Функция</option>
                      <option value="other">Другое</option>
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="tkt-sub" className="text-xs text-zinc-300">Тема</Label>
                    <Input
                      id="tkt-sub"
                      required
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      placeholder="Кратко суть вопроса"
                      className="mt-1 h-9 border-zinc-800 bg-zinc-900 text-xs text-white"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="tkt-msg" className="text-xs text-zinc-300">Сообщение</Label>
                  <Textarea
                    id="tkt-msg"
                    required
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Опишите вопрос, проблему или тариф, который вы хотите подключить..."
                    className="mt-1 min-h-[110px] border-zinc-800 bg-zinc-900 text-xs text-white"
                  />
                </div>

                <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-2.5 text-[11px] text-zinc-400">
                  Сообщение отправлено в поддержку. Ответ появится в разделе «Мои тикеты».
                </div>

                <Button
                  type="submit"
                  disabled={sending}
                  className="w-full bg-gradient-to-r from-zinc-100 via-white to-zinc-300 text-zinc-950 font-bold shadow-md hover:from-white hover:to-zinc-200 h-9 text-xs"
                >
                  {sending ? "Отправка…" : <><Send className="mr-1.5 h-3.5 w-3.5" /> Отправить тикет</>}
                </Button>
              </form>
            )}

            {/* Tab 2: User Tickets History */}
            {activeTab === "history" && (
              <div className="mt-4 overflow-y-auto space-y-3 pr-1 max-h-[60vh]">
                {!userEmail ? (
                  <div className="p-8 text-center text-xs text-zinc-500">
                    Укажите ваш email на вкладке создания обращения, чтобы увидеть историю тикетов.
                  </div>
                ) : tickets.length === 0 ? (
                  <div className="p-8 text-center text-xs text-zinc-500">
                    У вас пока нет открытых обращений. Если возникли трудности — напишите нам!
                  </div>
                ) : (
                  tickets.map((t) => (
                    <div
                      key={t.id}
                      className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-3.5 space-y-2"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-white">{t.subject}</span>
                        <span
                          className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${
                            t.status === "resolved"
                              ? "bg-emerald-500/20 text-emerald-400"
                              : t.status === "in_progress"
                              ? "bg-amber-500/20 text-amber-400"
                              : "bg-zinc-800 text-zinc-400"
                          }`}
                        >
                          {t.status === "resolved" ? "Решён" : t.status === "in_progress" ? "В работе" : "Открыт"}
                        </span>
                      </div>

                      <p className="text-xs text-zinc-300 whitespace-pre-wrap">{t.message}</p>

                      {/* Admin Reply Block */}
                      {t.adminReply ? (
                        <div className="mt-2 rounded-lg border border-emerald-500/30 bg-emerald-950/20 p-2.5 text-xs">
                          <div className="flex items-center gap-1.5 font-semibold text-emerald-300 text-[11px]">
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                            Ответ поддержки:
                          </div>
                          <p className="mt-1 text-zinc-200 whitespace-pre-wrap">{t.adminReply}</p>
                          <div className="mt-1 text-[10px] text-zinc-500">
                            {t.repliedAt ? new Date(t.repliedAt).toLocaleString("ru-RU") : ""}
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 text-[10px] text-zinc-500 mt-1">
                          <Clock className="h-3 w-3" /> Ожидает ответа администратора
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
