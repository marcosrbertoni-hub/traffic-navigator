import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { PublicPage } from "@/components/shared/PageScaffolds";
import { signUp } from "@/services/auth";

export const Route = createFileRoute("/cadastro.tsx")({
  component: CadastroPage,
});

function CadastroPage() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);
    const { data, error: authError } = await signUp(email.trim(), password, name.trim());
    setLoading(false);

    if (authError) {
      setError(authError.message);
      return;
    }

    if (data.session) {
      await navigate({ to: "/app" });
    } else {
      setMessage("Conta criada. Verifique seu e-mail para confirmar o acesso.");
    }
  }

  return (
    <PublicPage title="Criar conta" description="Crie sua conta e prepare seu primeiro site.">
      <form onSubmit={handleSubmit} className="mx-auto max-w-md space-y-5 rounded-2xl border bg-card p-6 shadow-sm">
        <div>
          <label className="text-sm font-medium">Nome</label>
          <input required value={name} onChange={(e) => setName(e.target.value)} className="mt-2 w-full rounded-lg border bg-background px-3 py-2" />
        </div>
        <div>
          <label className="text-sm font-medium">E-mail</label>
          <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-2 w-full rounded-lg border bg-background px-3 py-2" />
        </div>
        <div>
          <label className="text-sm font-medium">Senha</label>
          <input required minLength={6} type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="mt-2 w-full rounded-lg border bg-background px-3 py-2" />
        </div>
        {error && <p role="alert" className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}
        {message && <p className="rounded-lg bg-primary/10 p-3 text-sm">{message}</p>}
        <button disabled={loading} className="w-full rounded-lg bg-primary px-4 py-2 font-medium text-primary-foreground disabled:opacity-60">
          {loading ? "Criando..." : "Criar conta"}
        </button>
        <p className="text-center text-sm text-muted-foreground">
          Já possui conta? <Link to="/login" className="text-primary hover:underline">Entrar</Link>
        </p>
      </form>
    </PublicPage>
  );
}
