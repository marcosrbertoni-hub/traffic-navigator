import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Field, PageHeader, Panel } from "@/components/shared/kit";
import { siteRepo } from "@/services/campaigns";

export const Route = createFileRoute("/app/sites/novo")({ component: NewSite });

function NewSite() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [domain, setDomain] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;

    const normalized = domain
      .trim()
      .replace(/^https?:\/\//i, "")
      .split("/")[0]
      ?.replace(/\/$/, "") ?? "";

    if (!name.trim() || !normalized) {
      setError("Informe o nome e o domínio.");
      return;
    }

    if (!/^[a-z0-9.-]+\.[a-z]{2,}$/i.test(normalized)) {
      setError("Informe um domínio válido, por exemplo: exemplo.com.br");
      return;
    }

    setError("");
    setSaving(true);

    try {
      const site = await siteRepo.create({
        name: name.trim(),
        domain: normalized,
      });

      await navigate({
        to: "/app/sites/$id",
        params: { id: site.id },
      });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Não foi possível cadastrar o site. Verifique sua sessão e tente novamente.",
      );
      setSaving(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Adicionar site"
        description="Cadastre um domínio que você possui ou está autorizado a testar."
      />

      <Panel
        title="Dados do site"
        description="O cadastro é salvo na sua conta. A análise do domínio acontece depois."
      >
        <form className="max-w-2xl space-y-5" onSubmit={submit}>
          <Field label="Nome do site">
            <input
              id="site-name"
              name="name"
              autoComplete="organization"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Minha empresa"
              className="h-10 w-full rounded-md border bg-background px-3 text-sm"
              disabled={saving}
            />
          </Field>

          <Field
            label="Domínio"
            hint="Exemplo: exemplo.com.br. Não é necessário informar https://."
          >
            <input
              id="site-domain"
              name="domain"
              autoComplete="url"
              value={domain}
              onChange={(event) => setDomain(event.target.value)}
              placeholder="exemplo.com.br"
              className="h-10 w-full rounded-md border bg-background px-3 text-sm"
              disabled={saving}
            />
          </Field>

          {error && (
            <div
              role="alert"
              className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive break-words"
            >
              {error}
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={saving}
              onClick={() => navigate({ to: "/app/sites" })}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Salvando site..." : "Adicionar site"}
            </Button>
          </div>
        </form>
      </Panel>
    </div>
  );
}
