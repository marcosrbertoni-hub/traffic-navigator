import { Link } from "@tanstack/react-router";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PLANS } from "@/config/site";
import { fmtMoney, fmtNumber } from "@/lib/format";
import { cn } from "@/lib/utils";

/** Plan cards — `context` decides the CTA target (public signup vs in-app checkout placeholder). */
export function PlansGrid({ context = "public", currentPlanId }: { context?: "public" | "app"; currentPlanId?: string }) {
  return (
    <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
      {PLANS.map((p) => (
        <div key={p.id} className={cn("relative flex flex-col rounded-2xl border bg-card p-6 shadow-soft", p.highlighted && "border-primary shadow-glow")}>
          {p.highlighted && <span className="absolute -top-3 left-6 rounded-full bg-brand px-3 py-0.5 text-xs font-semibold text-ink">Mais escolhido</span>}
          <h3 className="text-lg font-semibold">{p.name}</h3>
          <p className="text-sm text-muted-foreground">{p.tagline}</p>
          <p className="mt-5 font-display text-3xl font-semibold">{p.price_monthly === 0 ? "Grátis" : fmtMoney(p.price_monthly)}</p>
          <p className="text-xs text-muted-foreground">{p.is_trial ? "créditos únicos de teste" : "por mês · valor configurável"}</p>
          <p className="mt-4 rounded-lg bg-muted px-3 py-2 text-sm"><strong>{fmtNumber(p.credits_monthly)}</strong> créditos</p>
          <ul className="mt-5 flex-1 space-y-2 text-sm">
            {p.features.map((f) => <li key={f} className="flex gap-2"><Check className="mt-0.5 size-4 text-primary" />{f}</li>)}
          </ul>
          {context === "public" ? (
            <Button className="mt-6" variant={p.highlighted ? "default" : "outline"} asChild><Link to="/cadastro">{p.is_trial ? "Começar teste" : "Contratar"}</Link></Button>
          ) : currentPlanId === p.id ? (
            <Button className="mt-6" variant="secondary" disabled>Plano atual</Button>
          ) : (
            <Button className="mt-6" variant={p.highlighted ? "default" : "outline"} disabled title="Pagamentos serão habilitados na próxima fase">Contratar (em breve)</Button>
          )}
        </div>
      ))}
    </div>
  );
}
