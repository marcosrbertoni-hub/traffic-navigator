import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, Panel, StatCard } from "@/components/shared/kit";
import { getSession } from "@/services/auth";
import { supabase } from "@/lib/supabase";

type Tx={id:string;type:string;amount:number;description:string;created_at:string};

export const Route=createFileRoute("/app/creditos")({component:Credits});

function Credits(){
 const [balance,setBalance]=useState(0); const [tx,setTx]=useState<Tx[]>([]); const [loading,setLoading]=useState(true);
 useEffect(()=>{void(async()=>{const s=await getSession(); if(!s){setLoading(false);return;}
  const [b,t]=await Promise.all([
   supabase.from("credit_balances").select("balance").eq("user_id",s.user.id).maybeSingle(),
   supabase.from("credit_transactions").select("id,type,amount,description,created_at").eq("user_id",s.user.id).order("created_at",{ascending:false}).limit(20)
  ]);
  if(!b.error) setBalance(b.data?.balance??0); if(!t.error) setTx((t.data??[]) as Tx[]); setLoading(false);
 })()},[]);
 return <div><PageHeader title="Créditos" description="Saldo e histórico de consumo da conta."/>
  <div className="grid gap-4 sm:grid-cols-2"><StatCard label="Saldo disponível" value={loading?"…":balance.toLocaleString("pt-BR")} hint="Créditos disponíveis para campanhas"/><StatCard label="Transações" value={loading?"…":tx.length.toLocaleString("pt-BR")} hint="Últimas movimentações"/></div>
  <Panel title="Histórico" className="mt-6"><div className="divide-y">{tx.map(x=><div key={x.id} className="flex justify-between gap-4 py-3 text-sm"><span>{x.description}</span><strong>{x.amount>0?"+":""}{x.amount}</strong></div>)}{!tx.length&&!loading&&<p className="text-sm text-muted-foreground">Nenhuma transação registrada.</p>}</div></Panel>
 </div>;
}
