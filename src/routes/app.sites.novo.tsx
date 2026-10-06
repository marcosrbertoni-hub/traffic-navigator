import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { DemoBanner, Field, PageHeader, Panel } from "@/components/shared/kit";
import { siteRepo } from "@/services/campaigns";

export const Route = createFileRoute("/app/sites/novo")({ component: NewSite });

function NewSite() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [domain, setDomain] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    const normalized = domain.trim().replace(/^https?:\/\//, "").replace(/\/.*$/, "").replace(/\/$/, "");
    if (!name.trim() || !normalized) return setError("Informe o nome e o domínio.");
    if (!/^[a-z0-9.-]+\.[a-z]{2,}$/i.test(normalized)) return setError("Informe um domínio válido, por exemplo: exemplo.com.br");

    setError("");
    setSaving(true);
    try {
      await siteRepo.create({ name: name.trim(), domain: normalized });
      await navigate({ to: "/app/sites" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível cadastrar o site.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <PageHeader title="Adicionar site" description="Cadastre um domínio que você possui ou está autorizado a testar." />
      <Panel title="Dados do site" description="Não é necessário informar protocolo.">
        <div className="max-w-2xl space-y-5">
          <Field label="Nome do site"><input value={name} onChange={(e) => setName(e.target.value)} placeholder="Minha empresa" className="h-10 w-full rounded-md border bg-background px-3 text-sm" /></Field>
          <Field label="Domínio"><input value={domain} onChange={(e) => setDomain(e.target.value)} placeholder="exemplo.com.br" className="h-10 w-full rounded-md border bg-background px-3 text-sm" /></Field>
          {error && <div role="alert" className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</div>}
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate({ to: "/app/sites" })}>Cancelar</Button>
            <Button disabled={saving} onClick={submit}>{saving ? "Salvando..." : "Adicionar site"}</Button>
          </div>
        </div>
      </Panel>
    </div>
  );
}
