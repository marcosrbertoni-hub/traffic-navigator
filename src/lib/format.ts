export const fmtNumber = (n: number) => new Intl.NumberFormat("pt-BR").format(n);
export const fmtDate = (iso: string | null) =>
  iso ? new Intl.DateTimeFormat("pt-BR", { dateStyle: "short" }).format(new Date(iso)) : "—";
export const fmtDateTime = (iso: string | null) =>
  iso ? new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(iso)) : "—";
export const fmtMoney = (n: number | null, currency = "BRL") =>
  n === null ? "A definir" : new Intl.NumberFormat("pt-BR", { style: "currency", currency }).format(n);
export const uid = () => Math.random().toString(36).slice(2, 10);
