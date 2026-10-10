import { createFileRoute, redirect, Outlet } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { AppHeader } from "@/components/AppHeader";
import { ADMIN_EMAIL } from "@/lib/subscription";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const { data } = await supabase.auth.getUser();
    const localAdmin =
      typeof window !== "undefined" && localStorage.getItem("reportix_admin_auth") === "true";
    if (!data.user && !localAdmin) throw redirect({ to: "/auth" });
    return { user: data.user || { id: "admin-master", email: ADMIN_EMAIL } };
  },
  component: () => (
    <div className="min-h-screen">
      <AppHeader />
      <Outlet />
    </div>
  ),
});
