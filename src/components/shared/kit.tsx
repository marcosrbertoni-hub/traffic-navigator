import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { FlaskConical, Inbox } from "lucide-react";
import { cn } from "@/lib/utils";

export function PageHeader({ title, description, actions }: { title: string; description?: string; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-2xl font-semibold text-foreground md:text-3xl">{title}</h1>
        {description && <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function Panel({ title, description, actions, children, className }: { title?: string; description?: string; actions?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={cn("rounded-xl border bg-card p-5 shadow-soft", className)}>
      {(title || actions) && (
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            {title && <h2 className="text-base font-semibold">{title}</h2>}
            {description && <p className="text-xs text-muted-foreground">{description}</p>}
          </div>
          {actions}
        </div>
      )}
      {children}
    </section>
  );
}

export function StatCard({ label, value, hint, icon: Icon, tone = "primary" }: { label: string; value: ReactNode; hint?: string; icon?: LucideIcon; tone?: "primary" | "success" | "warning" | "destructive" | "info" }) {
  const tones = {
    primary: "bg-accent text-accent-foreground",
    success: "bg-success/12 text-success",
    warning: "bg-warning/15 text-warning",
    destructive: "bg-destructive/10 text-destructive",
    info: "bg-info/10 text-info",
  };
  return (
    <div className="rounded-xl border bg-card p-5 shadow-soft">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</span>
        {Icon && (
          <span className={cn("grid size-8 place-items-center rounded-lg", tones[tone])}>
            <Icon className="size-4" />
          </span>
        )}
      </div>
      <div className="mt-3 font-display text-2xl font-semibold tabular-nums">{value}</div>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

export function DemoBanner({ children }: { children?: ReactNode }) {
  return (
    <div role="note" className="mb-6 flex items-start gap-3 rounded-xl border border-warning/40 bg-warning/10 px-4 py-3 text-sm">
      <FlaskConical className="mt-0.5 size-4 shrink-0 text-warning" />
      <p className="text-foreground">
        <strong>Modo demonstração.</strong>{" "}
        {children ?? "Os dados exibidos são fictícios e servem apenas para visualizar a interface. Nenhuma execução real acontece nesta fase."}
      </p>
    </div>
  );
}

const STATUS: Record<string, { label: string; cls: string }> = {
  active: { label: "Ativa", cls: "bg-success/12 text-success" },
  paused: { label: "Pausada", cls: "bg-warning/15 text-warning" },
  draft: { label: "Rascunho", cls: "bg-muted text-muted-foreground" },
  completed: { label: "Concluída", cls: "bg-info/10 text-info" },
  error: { label: "Erro", cls: "bg-destructive/10 text-destructive" },
  verified: { label: "Verificado", cls: "bg-success/12 text-success" },
  pending: { label: "Pendente", cls: "bg-warning/15 text-warning" },
  failed: { label: "Falhou", cls: "bg-destructive/10 text-destructive" },
  paid: { label: "Pago", cls: "bg-success/12 text-success" },
  refunded: { label: "Reembolsado", cls: "bg-info/10 text-info" },
  online: { label: "Online", cls: "bg-success/12 text-success" },
  idle: { label: "Ocioso", cls: "bg-info/10 text-info" },
  offline: { label: "Offline", cls: "bg-muted text-muted-foreground" },
  info: { label: "Info", cls: "bg-info/10 text-info" },
  warn: { label: "Aviso", cls: "bg-warning/15 text-warning" },
};
export function StatusBadge({ status }: { status: string }) {
  const s = STATUS[status] ?? { label: status, cls: "bg-muted text-muted-foreground" };
  return <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium", s.cls)}><span className="size-1.5 rounded-full bg-current" />{s.label}</span>;
}

export function EmptyState({ icon: Icon = Inbox, title, description, action }: { icon?: LucideIcon; title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed px-6 py-12 text-center">
      <span className="grid size-11 place-items-center rounded-full bg-muted text-muted-foreground"><Icon className="size-5" /></span>
      <h3 className="mt-4 font-semibold">{title}</h3>
      {description && <p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function Field({ label, hint, htmlFor, children }: { label: string; hint?: string; htmlFor?: string; children: ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={htmlFor} className="text-sm font-medium">{label}</label>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

export function NativeSelect(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={cn("h-9 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring", props.className)} />;
}

export function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button type="button" aria-pressed={active} onClick={onClick} className={cn("rounded-full border px-3 py-1.5 text-sm transition-colors", active ? "border-primary bg-primary text-primary-foreground" : "bg-background hover:bg-muted")}>
      {children}
    </button>
  );
}

/** Generic table — columns + rows; responsive horizontal scroll. */
export interface Column<T> { key: string; header: string; cell: (row: T) => ReactNode; className?: string }
export function DataTable<T>({ columns, rows, rowKey, empty }: { columns: Column<T>[]; rows: T[]; rowKey: (r: T) => string; empty?: ReactNode }) {
  if (!rows.length) return <>{empty ?? <EmptyState title="Nenhum registro" description="Os dados aparecerão aqui quando o backend estiver conectado." />}</>;
  return (
    <div className="overflow-x-auto rounded-xl border bg-card shadow-soft">
      <table className="w-full min-w-[640px] text-sm">
        <thead className="bg-muted/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
          <tr>{columns.map((c) => <th key={c.key} className={cn("px-4 py-3 font-medium", c.className)}>{c.header}</th>)}</tr>
        </thead>
        <tbody className="divide-y">
          {rows.map((r) => (
            <tr key={rowKey(r)} className="hover:bg-muted/30">
              {columns.map((c) => <td key={c.key} className={cn("px-4 py-3", c.className)}>{c.cell(r)}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
