import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { PublicPage } from "@/components/shared/PageScaffolds";
import { signIn } from "@/services/auth";

export const Route = createFileRoute("/login.tsx")({
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setLoading(true);
    const { error: authError } = await signIn(email.trim(), password);
    setLoading(false);

    if (authError) {
      setError(authError.message);
      return;
    }
    await navigate({ to: "/app" });
  }

  return (
    <PublicPage title="Entrar" description="Acesse sua conta para gerenciar sites e campanhas.">
      <form onSubmit={handleSubmit} className="mx-auto max-w-md space-y-5 rounded-2xl border bg-card p-6 shadow-sm">
        <div>
          <label className="text-sm font-medium">E-mail</label>
          <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-2 w-full rounded-lg border bg-background px-3 py-2" />
        </div>
        <div>
          <label className="text-sm font-medium">Senha</label>
          <input required minLength={6} type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="mt-2 w-full rounded-lg border bg-background px-3 py-2" />
        </div>
        {error && <p role="alert" className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}
        <button disabled={loading} className="w-full rounded-lg bg-primary px-4 py-2 font-medium text-primary-foreground disabled:opacity-60">
          {loading ? "Entrando..." : "Entrar"}
        </button>
        <div className="flex justify-between text-sm">
          <Link to="/recuperar-senha" className="text-primary hover:underline">Esqueci minha senha</Link>
          <Link to="/cadastro" className="text-primary hover:underline">Criar conta</Link>
        </div>
      </form>
    </PublicPage>
  );
}
