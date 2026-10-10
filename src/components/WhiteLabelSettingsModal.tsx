import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Sparkles, Upload, Palette, Building2, Globe, Phone, Crown, Check } from "lucide-react";
import { toast } from "sonner";
import { ACCENT_THEMES, getWhiteLabelConfig, saveWhiteLabelConfig, type WhiteLabelConfig } from "@/lib/whitelabel";
import { useActivePlan } from "@/lib/subscription";

interface WhiteLabelModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userEmail: string;
}

export function WhiteLabelSettingsModal({ open, onOpenChange, userEmail }: WhiteLabelModalProps) {
  const activePlan = useActivePlan(userEmail);
  const isAllowed = activePlan.isAdmin || activePlan.plan.id === "agency" || activePlan.plan.id === "enterprise";

  const [agencyName, setAgencyName] = useState("");
  const [agencySlogan, setAgencySlogan] = useState("");
  const [logoBase64, setLogoBase64] = useState<string | undefined>(undefined);
  const [accentColor, setAccentColor] = useState<keyof typeof ACCENT_THEMES>("silver");
  const [contacts, setContacts] = useState("");
  const [website, setWebsite] = useState("");
  const [removeBranding, setRemoveBranding] = useState(true);

  useEffect(() => {
    if (userEmail) {
      const cfg = getWhiteLabelConfig(userEmail);
      if (cfg) {
        setAgencyName(cfg.agencyName || "");
        setAgencySlogan(cfg.agencySlogan || "");
        setLogoBase64(cfg.logoBase64);
        setAccentColor(cfg.accentColor || "silver");
        setContacts(cfg.contacts || "");
        setWebsite(cfg.website || "");
        setRemoveBranding(cfg.removeReportixBranding !== false);
      }
    }
  }, [userEmail, open]);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error("Размер файла логотипа не должен превышать 2 МБ");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setLogoBase64(result);
      toast.success("Логотип агентства успешно загружен!");
    };
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    if (!isAllowed) {
      toast.error("Функция White-Label доступна на тарифе «Агентство» или VIP.");
      return;
    }

    if (!agencyName.trim()) {
      toast.error("Укажите название вашего агентства или компании");
      return;
    }

    const config: WhiteLabelConfig = {
      userEmail,
      agencyName: agencyName.trim(),
      agencySlogan: agencySlogan.trim(),
      logoBase64,
      accentColor,
      contacts: contacts.trim(),
      website: website.trim(),
      removeReportixBranding: removeBranding,
      updatedAt: new Date().toISOString(),
    };

    saveWhiteLabelConfig(config);
    toast.success("Настройки White-Label успешно сохранены!", {
      description: "Все новые отчёты и PDF будут оформляться в вашем фирменном стиле.",
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl border-zinc-800 bg-zinc-950 text-white shadow-2xl">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <Crown className="h-4 w-4" />
            </span>
            <DialogTitle className="text-xl font-semibold text-white">
              White-Label брендирование агентства
            </DialogTitle>
          </div>
          <DialogDescription className="text-zinc-400 text-sm">
            Загрузите логотип своей компании и выберите акцентные цвета. Клиенты будут видеть отчёты в вашем эксклюзивном стиле.
          </DialogDescription>
        </DialogHeader>

        {!isAllowed ? (
          <div className="my-4 rounded-xl border border-amber-500/40 bg-amber-950/20 p-5 text-center">
            <Crown className="mx-auto h-8 w-8 text-amber-400 mb-2" />
            <h4 className="text-sm font-semibold text-white">Требуется тариф «Агентство»</h4>
            <p className="mt-1 text-xs text-zinc-400 max-w-md mx-auto">
              Полный White-Label без упоминания Reportix, с собственным логотипом и цветовой схемой доступен клиентам агентского тарифа.
            </p>
            <Button
              className="mt-4 bg-gradient-to-r from-amber-500 to-amber-600 text-zinc-950 font-semibold"
              onClick={() => {
                onOpenChange(false);
                window.location.href = "/pricing";
              }}
            >
              Перейти к тарифам
            </Button>
          </div>
        ) : (
          <div className="space-y-4 py-2">
            {/* Agency Name & Slogan */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs text-zinc-300 flex items-center gap-1.5">
                  <Building2 className="h-3.5 w-3.5 text-zinc-400" /> Название агентства
                </Label>
                <Input
                  value={agencyName}
                  onChange={(e) => setAgencyName(e.target.value)}
                  placeholder="Apex Marketing Agency"
                  className="h-9 border-zinc-800 bg-zinc-900 text-xs text-white"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-zinc-300 flex items-center gap-1.5">
                  <Globe className="h-3.5 w-3.5 text-zinc-400" /> Слоган / Деятельность
                </Label>
                <Input
                  value={agencySlogan}
                  onChange={(e) => setAgencySlogan(e.target.value)}
                  placeholder="Performance & Growth"
                  className="h-9 border-zinc-800 bg-zinc-900 text-xs text-white"
                />
              </div>
            </div>

            {/* Logo Upload */}
            <div className="space-y-1.5">
              <Label className="text-xs text-zinc-300 flex items-center gap-1.5">
                <Upload className="h-3.5 w-3.5 text-zinc-400" /> Фирменный логотип (PNG, SVG, JPG до 2 МБ)
              </Label>
              <div className="flex items-center gap-4 rounded-xl border border-zinc-800/80 bg-zinc-900/60 p-3">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg border border-zinc-700/60 bg-zinc-950 p-1">
                  {logoBase64 ? (
                    <img src={logoBase64} alt="Логотип" className="max-h-full max-w-full object-contain" />
                  ) : (
                    <Building2 className="h-6 w-6 text-zinc-600" />
                  )}
                </div>
                <div className="flex-1">
                  <label className="inline-flex cursor-pointer items-center justify-center rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-zinc-700">
                    <span>{logoBase64 ? "Заменить логотип" : "Загрузить файл"}</span>
                    <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
                  </label>
                  {logoBase64 && (
                    <button
                      type="button"
                      onClick={() => setLogoBase64(undefined)}
                      className="ml-3 text-xs text-rose-400 hover:underline"
                    >
                      Удалить
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Accent Theme Selection */}
            <div className="space-y-2">
              <Label className="text-xs text-zinc-300 flex items-center gap-1.5">
                <Palette className="h-3.5 w-3.5 text-zinc-400" /> Фирменный акцентный цвет для отчётов и PDF
              </Label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {Object.entries(ACCENT_THEMES).map(([key, theme]) => {
                  const isSelected = accentColor === key;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setAccentColor(key as any)}
                      className={`flex items-center gap-2 rounded-lg border p-2 text-left text-xs transition ${
                        isSelected
                          ? "border-white bg-zinc-800 text-white shadow-sm ring-1 ring-white/40"
                          : "border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:text-white"
                      }`}
                    >
                      <span
                        className="h-3.5 w-3.5 rounded-full border border-black/40 shadow-sm"
                        style={{ backgroundColor: theme.accentHex }}
                      />
                      <span className="truncate text-[11px] font-medium">{theme.name.split(" ")[0]}</span>
                      {isSelected && <Check className="ml-auto h-3 w-3 text-white" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Contacts & Website */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs text-zinc-300 flex items-center gap-1.5">
                  <Phone className="h-3.5 w-3.5 text-zinc-400" /> Контакты для подписи
                </Label>
                <Input
                  value={contacts}
                  onChange={(e) => setContacts(e.target.value)}
                  placeholder="+7 (999) 000-00-00 · info@agency.ru"
                  className="h-9 border-zinc-800 bg-zinc-900 text-xs text-white"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-zinc-300 flex items-center gap-1.5">
                  <Globe className="h-3.5 w-3.5 text-zinc-400" /> Сайт агентства
                </Label>
                <Input
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  placeholder="https://agency.ru"
                  className="h-9 border-zinc-800 bg-zinc-900 text-xs text-white"
                />
              </div>
            </div>

            {/* Remove Reportix Branding Switch */}
            <div className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-900/60 p-3">
              <div>
                <div className="text-xs font-medium text-white">Скрыть упоминания Reportix</div>
                <div className="text-[11px] text-zinc-400">
                  В подвале и колонтитулах будет указано только ваше агентство.
                </div>
              </div>
              <Switch checked={removeBranding} onCheckedChange={setRemoveBranding} />
            </div>
          </div>
        )}

        {isAllowed && (
          <div className="mt-3 flex items-center justify-end gap-3 pt-3 border-t border-zinc-800">
            <Button variant="ghost" onClick={() => onOpenChange(false)} className="text-zinc-400 hover:text-white">
              Отмена
            </Button>
            <Button
              onClick={handleSave}
              className="bg-gradient-to-r from-zinc-100 via-white to-zinc-200 text-zinc-950 font-semibold shadow-[0_0_15px_rgba(255,255,255,0.25)] hover:from-white"
            >
              <Sparkles className="mr-1.5 h-4 w-4" /> Сохранить фирменный стиль
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
