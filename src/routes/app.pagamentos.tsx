import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, Panel, StatCard } from "@/components/shared/kit";
import { getSession } from "@/services/auth";
import { supabase } from "@/lib/supabase";
type Payment={id:string;amount:number;currency:string;status:string;description:string;created_at:string};
export const Route=createFileRoute("/app/pagamentos")({component:Payments});
function Payments(){const [rows,setRows]=useState<Payment[]>([]);const [loading,setLoading]=useState(true);
 useEffect(()=>{void(async()=>{const s=await getSession();if(!s){setLoading(false);return;}const {data,error}=await supabase.from("payments").select("id,amount,currency,status,description,created_at").eq("user_id",s.user.id).order("created_at",{ascending:false});if(!error)setRows((data??[]) as Payment[]);setLoading(false);})()},[]);
 const paid=rows.filter(x=>x.status==="paid").reduce((s,x)=>s+Number(x.amount),0);
 return <div><PageHeader title="Pagamentos" description="Assinaturas, faturas e histórico da conta."/><div className="grid gap-4 sm:grid-cols-2"><StatCard label="Pagamentos registrados" value={loading?"…":rows.length.toLocaleString("pt-BR")} hint="Histórico da conta"/><StatCard label="Total pago" value={loading?"…":paid.toLocaleString("pt-BR",{style:"currency",currency:"BRL"})} hint="Somente pagamentos confirmados"/></div><Panel title="Histórico" className="mt-6"><div className="divide-y">{rows.map(x=><div key={x.id} className="flex flex-wrap justify-between gap-3 py-3 text-sm"><div><b>{x.description}</b><div className="text-muted-foreground">{new Date(x.created_at).toLocaleString("pt-BR")}</div></div><span className="font-semibold">{Number(x.amount).toLocaleString("pt-BR",{style:"currency",currency:x.currency||"BRL"})} · {x.status}</span></div>)}{!rows.length&&!loading&&<p className="text-sm text-muted-foreground">Nenhum pagamento registrado.</p>}</div></Panel></div>;}