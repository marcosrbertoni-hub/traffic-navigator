import { Outlet, createFileRoute } from "@tanstack/react-router";
import { SiteFooter, SiteHeader } from "@/components/layout/SiteChrome";

export const Route = createFileRoute("/_site")({
  component: () => (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1"><Outlet /></main>
      <SiteFooter />
    </div>
  ),
});
