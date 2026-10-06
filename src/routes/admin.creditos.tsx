import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Field, PageHeader, Panel, DataTable } from "@/components/shared/kit";
import { supabase } from "@/lib/supabase";

type UserRow={id:string;full_name:string;role:string;balance:number};
export const Route=createFileRoute("/admin/creditos")({component:AdminCredits});

function AdminCredits(){
  const [rows,setRows]=useState<UserRow[]>([]);
  const [selected,setSelected]=useState("");
  const [amount,setAmount]=useState("1000");
  const [description,setDescription]=useState("Crédito concedido pelo administrador");
  const [message,setMessage]=useState("");
  const [loading,setLoading]=useState(true);

  const load=async()=>{
    setLoading(true);
    const {data:profiles,error}=await supabase.from("profiles").select("id,full_name,role").order("created_at",{ascending:false});
    if(error){setMessage(error.message);setLoading(false);return;}
    const ids=(profiles??[]).map((p)=>p.id);
    const {data:balances}=ids.length?await supabase.from("credit_balances").select("user_id,balance").in("user_id",ids):{data:[] as any[]};
    const map=new Map((balances??[]).map((b)=>[b.user_id,b.balance]));
    setRows((profiles??[]).map((p)=>({id:p.id,full_name:p.full_name||"Sem nome",role:p.role,balance:map.get(p.id)??0})));
    setLoading(false);
  };
  useEffect(()=>{void load()},[]);

  const grant=async()=>{
    setMessage("");
    const value=Number(amount);
    if(!selected||!Number.isInteger(value)||value<=0){setMessage("Selecione um usuário e informe um valor inteiro positivo.");return;}
    setLoading(true);
    const {data,error}=await supabase.rpc("admin_grant_credits",{p_user_id:selected,p_amount:value,p_description:description.trim()||"Crédito administrativo"});
    if(error){setMessage(error.message);setLoading(false);return;}
    setMessage(`Crédito concedido. Novo saldo: ${Number(data).toLocaleString("pt-BR")}.`);
    await load();
  };

  return <div>
    <PageHeader title="Créditos" description="Controle administrativo de saldos e concessões. Cada concessão gera um lançamento no histórico."/>
    <Panel title="Conceder créditos" description="Use esta operação para liberar créditos manualmente a um usuário.">
      <div className="grid gap-4 md:grid-cols-3">
        <Field label="Usuário"><select value={selected} onChange={e=>setSelected(e.target.value)} className="h-9 w-full rounded-md border bg-background px-3 text-sm"><option value="">Selecione...</option>{rows.map(r=><option key={r.id} value={r.id}>{r.full_name} — {r.id.slice(0,8)}</option>)}</select></Field>
        <Field label="Quantidade"><input value={amount} onChange={e=>setAmount(e.target.value)} type="number" min="1" step="1" className="h-9 w-full rounded-md border bg-background px-3 text-sm"/></Field>
        <Field label="Descrição"><input value={description} onChange={e=>setDescription(e.target.value)} className="h-9 w-full rounded-md border bg-background px-3 text-sm"/></Field>
      </div>
      <Button className="mt-4" onClick={()=>void grant()} disabled={loading}>{loading?"Processando…":"Conceder créditos"}</Button>
      {message&&<p className="mt-3 text-sm text-muted-foreground">{message}</p>}
    </Panel>
    <div className="mt-4"><DataTable rows={rows} rowKey={r=>r.id} columns={[
      {key:"name",header:"Usuário",cell:r=><span className="font-medium">{r.full_name}</span>},
      {key:"role",header:"Perfil",cell:r=>r.role},
      {key:"balance",header:"Saldo",cell:r=>r.balance.toLocaleString("pt-BR")},
      {key:"id",header:"ID",cell:r=><span className="font-mono text-xs">{r.id.slice(0,12)}…</span>}
    ]}/></div>
  </div>;
}