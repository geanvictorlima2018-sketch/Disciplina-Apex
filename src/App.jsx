import React, { useState, useCallback, useRef } from "react";
import { useInstallPrompt } from "./useInstallPrompt.js";

const LIME = "#C6FF00";
const CYAN = "#22D3EE";

function loadJSON(key, fallback) {
  try { const r = localStorage.getItem(key); return r ? JSON.parse(r) : fallback; } catch { return fallback; }
}
function saveJSON(key, value) { localStorage.setItem(key, JSON.stringify(value)); }

function useAppData() {
  const [profile, setProfile] = useState(() => loadJSON("apex:profile", null));
  const [state, setState] = useState(() => loadJSON("apex:state", { streak: 0, waterConsumedMl: 0, lastWaterDate: null, tasks: [], sleepLog: [], goals: { foco: 0, hidratacao: 0, tarefas: 0, sono: 0 } }));
  const saveProfile = useCallback((p) => { saveJSON("apex:profile", p); setProfile(p); }, []);
  const saveState = useCallback((updater) => { setState((prev) => { const next = typeof updater === "function" ? updater(prev) : updater; saveJSON("apex:state", next); return next; }); }, []);
  const resetAll = useCallback(() => { localStorage.removeItem("apex:profile"); localStorage.removeItem("apex:state"); setProfile(null); setState({ streak: 0, waterConsumedMl: 0, lastWaterDate: null, tasks: [], sleepLog: [], goals: { foco: 0, hidratacao: 0, tarefas: 0, sono: 0 } }); }, []);
  return { profile, state, saveProfile, saveState, resetAll };
}

function ApexRing({ percent, size = 96, stroke = 9, color = LIME, label, sub, pulse }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, percent));
  const offset = c - (pct / 100) * c;
  const id = useRef(`g-${Math.random().toString(36).slice(2)}`).current;
  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className={pulse ? "animate-pulse" : ""}>
        <defs><linearGradient id={id} x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor={color} stopOpacity="0.5" /><stop offset="100%" stopColor={color} stopOpacity="1" /></linearGradient></defs>
        <circle cx={size/2} cy={size/2} r={r} stroke="#1E1E1E" strokeWidth={stroke} fill="none" />
        <circle cx={size/2} cy={size/2} r={r} stroke={`url(#${id})`} strokeWidth={stroke} fill="none" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={offset} transform={`rotate(-90 ${size/2} ${size/2})`} style={{ transition: "stroke-dashoffset 700ms cubic-bezier(.22,1,.36,1)", filter: pct >= 100 ? `drop-shadow(0 0 6px ${color})` : "none" }} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-semibold text-white" style={{ fontFamily:"'Space Grotesk',sans-serif", fontSize: size * 0.2 }}>{label}</span>
        {sub && <span className="text-[10px] text-neutral-500 mt-0.5">{sub}</span>}
      </div>
    </div>
  );
}

function LinearBar({ percent, color = CYAN }) {
  const pct = Math.max(0, Math.min(100, percent));
  return <div className="w-full h-2 rounded-full bg-[#161616] overflow-hidden"><div className="h-full rounded-full" style={{ width:`${pct}%`, background:`linear-gradient(90deg,${color}66,${color})`, boxShadow: pct>=100?`0 0 8px ${color}`:"none", transition:"width 600ms cubic-bezier(.22,1,.36,1)" }} /></div>;
}

function Toast({ toast }) {
  if (!toast) return null;
  return <div className="fixed bottom-6 left-1/2 -translate-x-1/2 px-4 py-2.5 rounded-xl text-sm font-medium text-black z-50" style={{ background: LIME, boxShadow:`0 0 20px ${LIME}55` }}>{toast}</div>;
}

function InstallBanner() {
  const { canInstall, promptInstall, installed } = useInstallPrompt();
  if (installed || !canInstall) return null;
  return <div className="px-6 pt-4"><button onClick={promptInstall} className="w-full rounded-xl border border-[#1E1E1E] bg-[#0A0A0A] px-4 py-3 flex items-center justify-between"><span className="text-sm text-neutral-300">Instalar Apex na tela inicial</span><span className="text-xs font-semibold px-3 py-1.5 rounded-lg text-black" style={{ background: LIME }}>Instalar</span></button></div>;
}

function Field({ label, value, onChange, placeholder, type = "text" }) {
  return <div><label className="text-xs text-neutral-500 mb-1.5 block">{label}</label><input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="w-full bg-[#0A0A0A] border border-[#1E1E1E] rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-[#C6FF00] transition-colors" /></div>;
}

function Onboarding({ onDone }) {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({ nome:"", idade:"", peso:"", altura:"", email:"", meta:"" });
  const [sending, setSending] = useState(false);
  const metas = [{ id:"foco", label:"Foco / Produtividade", icon:"🎯" },{ id:"emagrecimento", label:"Emagrecimento", icon:"🔥" },{ id:"massa", label:"Ganho de Massa", icon:"💪" },{ id:"saude", label:"Saúde Geral", icon:"🌿" }];
  const valid0 = form.nome.trim().length > 1 && form.email.includes("@");
  const valid1 = Number(form.idade) > 0 && Number(form.peso) > 0 && Number(form.altura) > 0;
  const valid2 = !!form.meta;
  async function finish() {
    setSending(true);
    const waterGoalMl = Math.round(Number(form.peso) * 35);
    const profile = { nome:form.nome.trim(), email:form.email.trim(), idade:Number(form.idade), peso:Number(form.peso), altura:Number(form.altura), meta:form.meta, waterGoalMl, createdAt:new Date().toISOString() };
    try { await fetch("/api/email/welcome", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ nome:profile.nome, email:profile.email }) }); } catch(e) {}
    setTimeout(() => { setSending(false); onDone(profile); }, 400);
  }
  return (
    <div className="min-h-screen bg-black text-white flex flex-col justify-between px-6 py-10">
      <div>
        <div className="flex items-center gap-2 mb-10"><div className="w-2.5 h-2.5 rounded-full" style={{ background:LIME, boxShadow:`0 0 10px ${LIME}` }} /><span className="text-xs tracking-[0.25em] text-neutral-400 font-medium" style={{ fontFamily:"'Space Grotesk',sans-serif" }}>DISCIPLINA APEX</span></div>
        <div className="flex gap-1.5 mb-8">{[0,1,2].map((i)=><div key={i} className="h-1 flex-1 rounded-full" style={{ background: i<=step?LIME:"#1E1E1E" }} />)}</div>
        {step===0 && <div className="space-y-5"><h1 className="text-3xl font-bold" style={{ fontFamily:"'Space Grotesk',sans-serif" }}>Vamos te conhecer.</h1><p className="text-neutral-500 text-sm">Isso leva menos de um minuto.</p><Field label="Nome completo" value={form.nome} onChange={(v)=>setForm({...form,nome:v})} placeholder="Ex: Ana Souza" /><Field label="E-mail" value={form.email} onChange={(v)=>setForm({...form,email:v})} placeholder="voce@email.com" type="email" /></div>}
        {step===1 && <div className="space-y-5"><h1 className="text-3xl font-bold" style={{ fontFamily:"'Space Grotesk',sans-serif" }}>Seus dados físicos.</h1><p className="text-neutral-500 text-sm">Calculamos sua meta de água com isso.</p><div className="grid grid-cols-3 gap-3"><Field label="Idade" value={form.idade} onChange={(v)=>setForm({...form,idade:v})} placeholder="28" type="number" /><Field label="Peso (kg)" value={form.peso} onChange={(v)=>setForm({...form,peso:v})} placeholder="70" type="number" /><Field label="Altura (cm)" value={form.altura} onChange={(v)=>setForm({...form,altura:v})} placeholder="170" type="number" /></div>{form.peso>0&&<div className="rounded-xl border border-[#1E1E1E] bg-[#0A0A0A] p-4 flex items-center justify-between"><span className="text-xs text-neutral-500">Sua meta diária de água</span><span className="font-bold text-lg" style={{ color:CYAN, fontFamily:"'Space Grotesk',sans-serif" }}>{Math.round(Number(form.peso)*35)} ml</span></div>}</div>}
        {step===2 && <div className="space-y-5"><h1 className="text-3xl font-bold" style={{ fontFamily:"'Space Grotesk',sans-serif" }}>Qual é seu foco?</h1><p className="text-neutral-500 text-sm">Vamos priorizar suas metas.</p><div className="grid grid-cols-2 gap-3">{metas.map((m)=><button key={m.id} onClick={()=>setForm({...form,meta:m.id})} className={`rounded-xl p-4 text-left border transition-all ${form.meta===m.id?"border-[#C6FF00] bg-[#C6FF00]/10":"border-[#1E1E1E] bg-[#0A0A0A]"}`}><div className="text-2xl mb-2">{m.icon}</div><div className="text-sm font-medium text-neutral-200">{m.label}</div></button>)}</div></div>}
      </div>
      <div className="flex gap-3 mt-8">
        {step>0&&<button onClick={()=>setStep(step-1)} className="px-5 py-3.5 rounded-xl border border-[#1E1E1E] text-neutral-400 text-sm">Voltar</button>}
        <button disabled={(step===0&&!valid0)||(step===1&&!valid1)||(step===2&&!valid2)||sending} onClick={()=>step<2?setStep(step+1):finish()} className="flex-1 py-3.5 rounded-xl font-semibold text-black disabled:opacity-30" style={{ background:LIME, fontFamily:"'Space Grotesk',sans-serif" }}>{sending?"Criando...":step<2?"Continuar":"Começar minha jornada"}</button>
      </div>
    </div>
  );
}

function PixModal({ onClose }) {
  const [phase, setPhase] = useState("plan");
  const [pix, setPix] = useState(null);
  const [error, setError] = useState(null);
  async function generatePix() {
    setPhase("loading"); setError(null);
    try {
      const res = await fetch("/api/pix/create", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ plan:"premium_mensal", name:"Cliente Apex", email:"cliente@email.com" }) });
      if (!res.ok) throw new Error((await res.json()).error||"Erro");
      setPix(await res.json()); setPhase("qr");
    } catch(e) { setError(e.message); setPhase("plan"); }
  }
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-end justify-center p-4">
      <div className="bg-[#0A0A0A] border border-[#1E1E1E] rounded-2xl w-full max-w-sm p-6">
        {phase==="plan"&&<><div className="flex justify-between mb-4"><div><h3 className="font-bold text-xl" style={{ fontFamily:"'Space Grotesk',sans-serif" }}>Apex Premium</h3><p className="text-neutral-500 text-xs mt-1">7 dias grátis, depois R$ 29,90/mês</p></div><button onClick={onClose} className="text-neutral-500 text-xl">×</button></div><div className="rounded-xl border border-[#C6FF00]/30 bg-[#C6FF00]/5 p-3 mb-5 text-xs text-neutral-300">Você não paga nada agora. Cancele antes do fim do teste.</div>{error&&<p className="text-xs text-red-400 mb-3">{error}</p>}<button onClick={generatePix} className="w-full py-3.5 rounded-xl font-semibold text-black mb-2" style={{ background:LIME }}>Pagar com Pix</button><p className="text-[11px] text-neutral-600 text-center">Processado via Asaas</p></>}
        {phase==="loading"&&<div className="py-10 flex flex-col items-center gap-3"><div className="w-10 h-10 rounded-full border-2 border-[#1E1E1E] border-t-[#22D3EE] animate-spin" /><p className="text-sm text-neutral-500">Gerando QR Code...</p></div>}
        {phase==="qr"&&pix&&<div className="text-center"><h3 className="font-bold text-lg mb-3" style={{ fontFamily:"'Space Grotesk',sans-serif" }}>Escaneie para pagar</h3><div className="bg-white rounded-xl p-3 mx-auto w-48 h-48 flex items-center justify-center mb-4">{pix.qrCodeImage?<img src={`data:image/png;base64,${pix.qrCodeImage}`} alt="QR" className="w-full h-full" />:<span className="text-black text-[11px] px-2">QR Code aparece aqui</span>}</div><div className="flex gap-2"><input readOnly value={pix.payload||""} className="flex-1 bg-[#121212] border border-[#1E1E1E] rounded-lg px-3 py-2 text-[11px] text-neutral-400 truncate" /><button onClick={()=>navigator.clipboard?.writeText(pix.payload)} className="px-3 py-2 rounded-lg text-xs font-semibold text-black" style={{ background:CYAN }}>Copiar</button></div><button onClick={onClose} className="w-full mt-4 py-3 rounded-xl border border-[#1E1E1E] text-neutral-400 text-sm">Fechar</button></div>}
      </div>
    </div>
  );
}

function Dashboard({ profile, state, saveState, onReset }) {
  const [toast, setToast] = useState(null);
  const [showPix, setShowPix] = useState(false);
  const [newTask, setNewTask] = useState("");
  const timer = useRef(null);
  function flash(msg) { setToast(msg); clearTimeout(timer.current); timer.current = setTimeout(()=>setToast(null),1800); }
  const waterGoal = profile.waterGoalMl || 2000;
  const waterPct = Math.round((state.waterConsumedMl/waterGoal)*100);
  const adjustWater = useCallback((delta) => {
    saveState((prev) => {
      const next = Math.max(0, prev.waterConsumedMl + delta);
      if (prev.waterConsumedMl < waterGoal && next >= waterGoal) flash("Meta de água concluída! 💧");
      return { ...prev, waterConsumedMl:next, goals:{...prev.goals, hidratacao:Math.min(100,Math.round((next/waterGoal)*100))} };
    });
  }, [saveState, waterGoal]);
  const done = state.tasks.filter(t=>t.done).length;
  const tasksPct = state.tasks.length ? Math.round((done/state.tasks.length)*100) : 0;
  function addTask() { if (!newTask.trim()) return; saveState(p=>({...p, tasks:[...p.tasks,{id:Date.now(),title:newTask.trim(),done:false}]})); setNewTask(""); }
  function toggleTask(id) {
    saveState(p=>{
      const tasks = p.tasks.map(t=>t.id===id?{...t,done:!t.done}:t);
      const d = tasks.filter(t=>t.done).length;
      if (tasks.length>0&&d===tasks.length&&p.tasks.filter(t=>t.done).length<tasks.length) flash("Todas concluídas! 🔥");
      return {...p,tasks,goals:{...p.goals,tarefas:tasks.length?Math.round((d/tasks.length)*100):0}};
    });
  }
  function markStreak() {
    const today = new Date().toDateString();
    if (state.lastWaterDate===today) { flash("Já marcou hoje ✔"); return; }
    saveState(p=>({...p,streak:p.streak+1,lastWaterDate:today}));
    flash("Streak +1 🔥");
  }
  const cards = [
    {id:"hidratacao",label:"Hidratação",pct:waterPct,color:CYAN,sub:`${state.waterConsumedMl}/${waterGoal}ml`},
    {id:"tarefas",label:"Tarefas",pct:tasksPct,color:LIME,sub:`${done}/${state.tasks.length||0}`},
    {id:"sono",label:"Sono",pct:state.goals.sono,color:"#818CF8",sub:`${state.sleepLog.length} reg.`},
    {id:"streak",label:"Streak",pct:Math.min(100,state.streak*10),color:"#FB923C",sub:`${state.streak} dias`},
  ];
  return (
    <div className="min-h-screen bg-black text-white pb-16">
      <Toast toast={toast} />
      {showPix&&<PixModal onClose={()=>setShowPix(false)} />}
      <InstallBanner />
      <div className="px-6 pt-8 pb-6 flex items-center justify-between">
        <div><p className="text-neutral-500 text-xs">Bem-vindo(a) de volta</p><h1 className="text-2xl font-bold" style={{ fontFamily:"'Space Grotesk',sans-serif" }}>{profile.nome.split(" ")[0]}</h1></div>
        <button onClick={()=>setShowPix(true)} className="text-[11px] font-semibold px-3 py-2 rounded-lg text-black" style={{ background:LIME }}>Ir Premium</button>
      </div>
      <div className="px-6 mb-6"><div className="rounded-2xl border border-[#1E1E1E] bg-[#0A0A0A] p-5 flex items-center gap-5">
        <ApexRing percent={waterPct} size={100} color={CYAN} label={`${waterPct}%`} sub="hidratação" pulse={waterPct>=100} />
        <div className="flex-1"><p className="text-sm text-neutral-400 mb-3">{state.waterConsumedMl} ml <span className="text-neutral-600">/ {waterGoal} ml</span></p><div className="flex items-center gap-2"><button onClick={()=>adjustWater(-200)} className="w-10 h-10 rounded-full border border-[#1E1E1E] text-lg font-bold text-neutral-300 active:scale-90 transition-transform">−</button><span className="text-xs text-neutral-500 w-14 text-center">200ml</span><button onClick={()=>adjustWater(200)} className="w-10 h-10 rounded-full text-lg font-bold text-black active:scale-90 transition-transform" style={{ background:CYAN }}>+</button></div></div>
      </div></div>
      <div className="px-6 grid grid-cols-2 gap-3 mb-6">{cards.map(g=><div key={g.id} className="rounded-2xl border border-[#1E1E1E] bg-[#0A0A0A] p-4 flex flex-col items-center gap-2"><ApexRing percent={g.pct} size={72} stroke={7} color={g.color} label={`${g.pct}%`} pulse={g.pct>=100} /><span className="text-xs font-medium text-neutral-300">{g.label}</span><span className="text-[10px] text-neutral-600">{g.sub}</span></div>)}</div>
      <div className="px-6 mb-6"><button onClick={markStreak} className="w-full rounded-2xl border border-[#1E1E1E] bg-[#0A0A0A] p-4 flex items-center justify-between active:scale-[.98] transition-transform"><div><p className="text-xs text-neutral-500">Sequência atual</p><p className="text-xl font-bold" style={{ color:"#FB923C", fontFamily:"'Space Grotesk',sans-serif" }}>{state.streak} dias</p></div><span className="text-xs font-semibold px-4 py-2 rounded-lg" style={{ background:"#FB923C22",color:"#FB923C" }}>Marcar hoje</span></button></div>
      <div className="px-6">
        <div className="flex items-center justify-between mb-3"><h2 className="font-semibold text-sm text-neutral-300" style={{ fontFamily:"'Space Grotesk',sans-serif" }}>Tarefas de hoje</h2><span className="text-xs text-neutral-600">{done}/{state.tasks.length}</span></div>
        <LinearBar percent={tasksPct} color={LIME} />
        <div className="mt-4 space-y-2">
          {state.tasks.map(t=><button key={t.id} onClick={()=>toggleTask(t.id)} className="w-full flex items-center gap-3 rounded-xl border border-[#1E1E1E] bg-[#0A0A0A] px-4 py-3 text-left"><span className="w-5 h-5 rounded-full border flex items-center justify-center shrink-0" style={{ borderColor:t.done?LIME:"#333",background:t.done?LIME:"transparent" }}>{t.done&&<span className="text-black text-[11px] font-bold">✓</span>}</span><span className={`text-sm ${t.done?"text-neutral-600 line-through":"text-neutral-200"}`}>{t.title}</span></button>)}
          {state.tasks.length===0&&<p className="text-xs text-neutral-600 py-2">Nenhuma tarefa. Adicione abaixo.</p>}
        </div>
        <div className="flex gap-2 mt-3"><input value={newTask} onChange={e=>setNewTask(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addTask()} placeholder="Nova tarefa..." className="flex-1 bg-[#0A0A0A] border border-[#1E1E1E] rounded-xl px-4 py-3 text-sm outline-none focus:border-[#C6FF00]" /><button onClick={addTask} className="px-4 rounded-xl font-semibold text-black" style={{ background:LIME }}>+</button></div>
      </div>
      <div className="px-6 mt-10"><button onClick={onReset} className="text-[11px] text-neutral-600 underline">Zerar dados</button></div>
    </div>
  );
}

export default function App() {
  const { profile, state, saveProfile, saveState, resetAll } = useAppData();
  return profile ? <Dashboard profile={profile} state={state} saveState={saveState} onReset={resetAll} /> : <Onboarding onDone={saveProfile} />;
}
