import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import type { LucideIcon } from "lucide-react";
import { BarChart3, CalendarClock, Gauge, Globe, Layers, MapPin, MonitorSmartphone, Route as RouteIcon, ShieldCheck, Workflow } from "lucide-react";
import { Button } from "@/components/ui/button";

export const FEATURES: { icon: LucideIcon; title: string; text: string }[] = [
  { icon: Workflow, title: "Campanhas em etapas", text: "Assistente guiado para configurar sessões, páginas, origens, localização, volume e horários." },
  { icon: Globe, title: "Gestão de sites", text: "Cadastre domínios, verifique a propriedade e prepare a análise de sitemap e páginas." },
  { icon: RouteIcon, title: "Roteiros de navegação", text: "Defina URL inicial, páginas internas e quantas páginas cada sessão deve percorrer." },
  { icon: MonitorSmartphone, title: "Desktop e mobile", text: "Distribua os testes entre tipos de dispositivo para cobrir diferentes experiências." },
  { icon: MapPin, title: "Cenários de localização", text: "Configure país, região, cidade e fuso horário para os cenários de teste." },
  { icon: CalendarClock, title: "Agendamento", text: "Escolha dias, janelas de horário e prioridades para distribuir as tarefas." },
  { icon: Gauge, title: "Créditos transparentes", text: "Estimativa de consumo antes de criar a campanha e histórico detalhado." },
  { icon: BarChart3, title: "Relatórios", text: "Tarefas planejadas e executadas, páginas testadas, duração, sucesso e erros." },
  { icon: ShieldCheck, title: "Uso responsável", text: "Testes apenas em sites de sua propriedade, com verificação de domínio." },
  { icon: Layers, title: "Pronta para escalar", text: "Arquitetura preparada para filas, agendador e execução distribuída." },
];

export const STEPS = [
  { n: "01", title: "Cadastre seu site", text: "Adicione o domínio e confirme que ele é seu." },
  { n: "02", title: "Monte a campanha", text: "Defina páginas, dispositivos, origens de teste, volume e horários." },
  { n: "03", title: "Revise o consumo", text: "Veja a estimativa de créditos e a programação antes de ativar." },
  { n: "04", title: "Acompanhe os resultados", text: "Analise execuções, páginas testadas e erros nos relatórios." },
];

export function PageHero({ eyebrow, title, text, children }: { eyebrow: string; title: ReactNode; text: string; children?: ReactNode }) {
  return (
    <section className="relative overflow-hidden bg-ink-gradient text-ink-foreground">
      <div className="absolute inset-0 bg-grid opacity-60" aria-hidden />
      <div className="relative mx-auto max-w-6xl px-4 py-16 md:py-20">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-primary-glow">{eyebrow}</p>
        <h1 className="mt-3 max-w-3xl text-3xl font-semibold md:text-5xl">{title}</h1>
        <p className="mt-4 max-w-2xl text-ink-muted">{text}</p>
        {children}
      </div>
    </section>
  );
}

export function CtaBand() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-16">
      <div className="flex flex-col items-start gap-6 rounded-2xl bg-brand p-8 text-ink md:flex-row md:items-center md:justify-between md:p-12">
        <div>
          <h2 className="text-2xl font-semibold md:text-3xl">Comece com créditos de teste</h2>
          <p className="mt-2 max-w-lg text-ink/80">Crie sua conta, cadastre um site e monte sua primeira campanha em minutos.</p>
        </div>
        <Button size="lg" variant="secondary" asChild><Link to="/cadastro">Criar conta grátis</Link></Button>
      </div>
    </section>
  );
}

export function Prose({ children }: { children: ReactNode }) {
  return <div className="mx-auto max-w-3xl space-y-4 px-4 py-14 text-sm leading-relaxed text-muted-foreground [&_h2]:mt-8 [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-foreground">{children}</div>;
}
