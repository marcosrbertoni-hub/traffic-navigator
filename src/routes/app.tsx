import { Outlet, createFileRoute, redirect } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { APP_NAV } from "@/config/navigation";
import { getSession } from "@/services/auth";
import { hydrateBackendState } from "@/services/campaigns";

export const Route = createFileRoute("/app")({
  beforeLoad: async ({ location }) => {
    const session = await getSession();
    if (!session) {
      throw redirect({
        to: "/login",
        search: { redirect: location.href },
      });
    }
    await hydrateBackendState();
    return { session };
  },
  component: () => (
    <AppShell nav={APP_NAV} home="/app">
      <Outlet />
    </AppShell>
  ),
});
