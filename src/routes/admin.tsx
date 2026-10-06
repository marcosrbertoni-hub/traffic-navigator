import { Outlet, createFileRoute, redirect } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { ADMIN_NAV } from "@/config/navigation";
import { getSession } from "@/services/auth";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/admin")({
  beforeLoad: async ({ location }) => {
    const session = await getSession();
    if (!session) {
      throw redirect({ to: "/login" });
    }

    const { data: profile, error } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", session.user.id)
      .maybeSingle();

    if (error || profile?.role !== "admin") {
      throw redirect({ to: "/app" });
    }
  },
  component: () => (
    <AppShell nav={ADMIN_NAV} home="/admin" badge="ADMIN">
      <Outlet />
    </AppShell>
  ),
});
