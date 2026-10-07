import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { PageHeader, Panel } from "@/components/shared/kit";
import { Button } from "@/components/ui/button";
import { getSession, signOut } from "@/services/auth";
export const Route=createFileRoute("/app/configuracoes")({component:Settings});
function Settings(){const [email,setEmail]=useState("");const [name,setName]=useState("");const navigate=useNavigate();
 useEffect(()=>{void getSession().then(s=>{if(s){setEmail(s.user.email??"");setName(String(s.user.user_metadata?.["display_name"]??""));}})},[]);
 const logout=async()=>{await signOut();await navigate({to:"/login"});};
 return <div className="space-y-6"><PageHeader title="Configurações" description="Preferências e acesso da sua conta."/><Panel title="Conta"><div className="grid gap-4 sm:grid-cols-2"><div><div className="text-xs text-muted-foreground">Nome</div><div className="mt-1 font-medium">{name||"Não informado"}</div></div><div><div className="text-xs text-muted-foreground">E-mail</div><div className="mt-1 font-medium">{email||"—"}</div></div></div></Panel><Panel title="Sessão"><p className="text-sm text-muted-foreground">Encerre a sessão neste navegador. Seus dados permanecem associados à sua conta.</p><Button className="mt-4" variant="outline" onClick={logout}>Sair da conta</Button></Panel></div>;}