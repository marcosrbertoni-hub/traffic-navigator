import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Menu, X } from "lucide-react";
import { Logo } from "./Logo";
import { Button } from "@/components/ui/button";
import { PUBLIC_NAV } from "@/config/navigation";
import { BRAND } from "@/config/site";

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-30 border-b bg-background/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-6 px-4">
        <Logo />
        <nav aria-label="Principal" className="hidden flex-1 items-center gap-1 md:flex">
          {PUBLIC_NAV.map((n) => (
            <Link key={n.to} to={n.to} className="rounded-md px-3 py-2 text-sm text-muted-foreground hover:text-foreground" activeProps={{ className: "!text-foreground font-medium" }}>{n.label}</Link>
          ))}
        </nav>
        <div className="ml-auto hidden items-center gap-2 md:flex">
          <Button variant="ghost" asChild><Link to="/login">Entrar</Link></Button>
          <Button asChild><Link to="/cadastro">Criar conta grátis</Link></Button>
        </div>
        <button aria-label="Menu" className="ml-auto rounded-md p-2 md:hidden" onClick={() => setOpen(!open)}>{open ? <X className="size-5" /> : <Menu className="size-5" />}</button>
      </div>
      {open && (
        <nav className="border-t px-4 py-3 md:hidden">
          {PUBLIC_NAV.map((n) => <Link key={n.to} to={n.to} onClick={() => setOpen(false)} className="block py-2 text-sm">{n.label}</Link>)}
          <div className="mt-3 flex gap-2">
            <Button variant="outline" className="flex-1" asChild><Link to="/login">Entrar</Link></Button>
            <Button className="flex-1" asChild><Link to="/cadastro">Criar conta</Link></Button>
          </div>
        </nav>
      )}
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="bg-ink text-ink-muted">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 md:grid-cols-4">
        <div className="md:col-span-2">
          <Logo className="text-ink-foreground" />
          <p className="mt-3 max-w-sm text-sm">{BRAND.tagline}. Planeje, agende e acompanhe testes de navegação nos seus próprios sites.</p>
        </div>
        <div className="space-y-2 text-sm">
          <p className="font-semibold text-ink-foreground">Produto</p>
          {PUBLIC_NAV.map((n) => <Link key={n.to} to={n.to} className="block hover:text-ink-foreground">{n.label}</Link>)}
        </div>
        <div className="space-y-2 text-sm">
          <p className="font-semibold text-ink-foreground">Conta e legal</p>
          <Link to="/login" className="block hover:text-ink-foreground">Entrar</Link>
          <Link to="/cadastro" className="block hover:text-ink-foreground">Cadastro</Link>
          <Link to="/termos" className="block hover:text-ink-foreground">Termos de Uso</Link>
          <Link to="/privacidade" className="block hover:text-ink-foreground">Política de Privacidade</Link>
        </div>
      </div>
      <div className="border-t border-ink-line py-5 text-center text-xs">© {new Date().getFullYear()} {BRAND.name}. Todos os direitos reservados.</div>
    </footer>
  );
}
