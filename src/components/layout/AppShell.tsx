import { useEffect, useState, type ReactNode } from "react";
import { Link, type LinkProps } from "@tanstack/react-router";
import type { LucideIcon } from "lucide-react";
import { LogOut, Menu, X } from "lucide-react";
import { Logo } from "./Logo";
import { cn } from "@/lib/utils";
import { onAuthStateChange, signOut } from "@/services/auth";

export type NavItem = { to: NonNullable<LinkProps["to"]>; label: string; icon: LucideIcon; exact?: boolean };

/** Shared shell for the client area and the admin panel (sidebar + topbar). */
export function AppShell({ nav, home, badge, footer, children }: { nav: NavItem[]; home: "/app" | "/admin"; badge?: string; footer?: ReactNode; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const sidebar = (
    <div className="flex h-full flex-col bg-ink-gradient text-ink-foreground">
      <div className="flex h-16 items-center justify-between px-5">
        <Logo to={home} className="text-ink-foreground" />
        {badge && <span className="rounded-md bg-primary-glow/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-primary-glow">{badge}</span>}
      </div>
      <nav aria-label="Menu principal" className="flex-1 space-y-0.5 overflow-y-auto px-3 py-2">
        {nav.map((item) => (
          <Link
            key={item.label}
            to={item.to}
            onClick={() => setOpen(false)}
            activeOptions={{ exact: item.exact }}
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-ink-muted transition-colors hover:bg-sidebar-accent hover:text-ink-foreground"
            activeProps={{ className: "bg-sidebar-accent !text-ink-foreground font-medium" }}
          >
            <item.icon className="size-4" />
            {item.label}
          </Link>
        ))}
      </nav>
      {footer && <div className="border-t border-ink-line p-4">{footer}</div>}
    </div>
  );

  useEffect(() => {
    const { data } = onAuthStateChange((session) => setEmail(session?.user.email ?? ""));
    return () => data.subscription.unsubscribe();
  }, []);

  async function handleSignOut() {
    await signOut();
    window.location.assign("/login");
  }

  return (
    <div className="min-h-screen bg-background">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 lg:block">{sidebar}</aside>
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button aria-label="Fechar menu" className="absolute inset-0 bg-ink/60" onClick={() => setOpen(false)} />
          <aside className="relative h-full w-72">{sidebar}</aside>
        </div>
      )}
      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b bg-background/85 px-4 backdrop-blur md:px-8">
          <button aria-label={open ? "Fechar menu" : "Abrir menu"} className="rounded-md p-2 hover:bg-muted lg:hidden" onClick={() => setOpen(!open)}>
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
          <div className="ml-auto flex items-center gap-3">
            <span className="hidden max-w-56 truncate text-sm text-muted-foreground sm:inline">{email || "Conta"}</span>
            <button type="button" onClick={handleSignOut} title="Sair" className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground">
              <LogOut className="size-4" />
            </button>
            <span className="grid size-9 place-items-center rounded-full bg-accent text-sm font-semibold text-accent-foreground">
              {(email[0] ?? "U").toUpperCase()}
            </span>
          </div>
        </header>
        <main className="mx-auto max-w-7xl px-4 py-6 md:px-8 md:py-8">{children}</main>
      </div>
    </div>
  );
}
