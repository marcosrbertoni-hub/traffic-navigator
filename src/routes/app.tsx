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
    // A falha de hidratação não pode bloquear a abertura das rotas do aplicativo.
    // Cada tela que grava dados trata seus próprios erros diretamente no Supabase.
    void hydrateBackendState().catch((error) => {
      console.error("Falha ao carregar dados do aplicativo:", error);
    });
    return { session };
  },
  component: () => (
    <AppShell nav={APP_NAV} home="/app">
      <Outlet />
    </AppShell>
  ),
});
