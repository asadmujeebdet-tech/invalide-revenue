"use client";
import {useEffect,useMemo,useState} from "react";
import {useRouter} from "next/navigation";
import {ResponsiveContainer,AreaChart,Area,XAxis,YAxis,Tooltip,CartesianGrid} from "recharts";

const days=["D0","D1","D2","D3","D4"];
const colors=["var(--c0)","var(--c1)","var(--c2)","var(--c3)","var(--c4)"];
const icons:any={
"All Video Downloader X":"https://lh3.googleusercontent.com/drJQsOnb3KqJhJCs-CWjNfS6ajomyaNSRj1rkLuUJdmUq8FsMix4Enc0MBHb6veYdmqM2NJDGg=s32",
"Phone Cleaner Junk Remover":"https://lh3.googleusercontent.com/m36tGO36s9u1IsS9RmhdNj24BQpBxsTcWFZdV1su174oNmJ5_3YGAoywi7wMFZ99FVGhddEwTw=s32",
"Antivirus - Clean Virus, Junk":"https://lh3.googleusercontent.com/dfkVj-KpDvNMM3XJCF7zn7hWEn6gpQDcf6zEe21cjCrxEIWRAho97Ah2RX7ot5eYhOxYreH1oQ=s32",
"Antivirus Cleaner Pro":"https://lh3.googleusercontent.com/dfkVj-KpDvNMM3XJCF7zn7hWEn6gpQDcf6zEe21cjCrxEIWRAho97Ah2RX7ot5eYhOxYreH1oQ=s32",
"Phone - Junk Cleaner":"https://lh3.googleusercontent.com/4-2u2EQbcRAB9xhTFb7ij3SPQN2M5FnH7FHn6E5o5wcaMM82uBezVSZYlWI8nhnINTmz5IsKPg=s32",
"GPS Map Location: Route Finder":"https://lh3.googleusercontent.com/QniK9fEnkQYFAtVWFMr6Ac1_yGo56wxyZ5cQ3jhjWe-5V62-Tc8sl9RYXchskZuXXjFZwOlw=s32",
"GPS Maps & 3D Navigation":"https://lh3.googleusercontent.com/8wIYbFKhuCBcC6G0Xsd-QrLOMlT6RDDs1FzevOiXkC8k_v_ceXdP780whZUTlQSNr4kooL-_VBY=s32",
"GPS Navigation Map Route Find":"https://lh3.googleusercontent.com/H6-KSAi9SjudiEwT5HplOJ0dauusCC3CzR5u4gAfwaNqnZe_iDbOJBE8BdfXFThku188Q1F4=s32",
"GPS Navigation: Satellite View":"https://lh3.googleusercontent.com/6yVUa1FnofKnlis40f9QlrqrrmCdLnTR2SsfY7w8N-rj-DinRjVRASFFE6XT3aA1-O5vo2-eNBw=s32"
};
const ico:any={search:"M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM21 21l-4.3-4.3",menu:"M3 6h18M3 12h18M3 18h18",moon:"M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z",sun:"M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10zM12 1v2M12 21v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M1 12h2M21 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4",arrow:"M5 12h14m-6-6 6 6-6 6",refresh:"M20 11a8 8 0 1 0 1 2M20 4v7h-7",layers:"M12 2 2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5",alert:"M12 9v4m0 4h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"};
const Icon=({t,s=16}:{t:string;s?:number})=><svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d={ico[t]||ico.layers}/></svg>;
const money=(n:any)=>new Intl.NumberFormat("en-US",{style:"currency",currency:"USD",notation:"compact",maximumFractionDigits:1}).format(Number(n)||0);
const pct=(n:any)=>n==null?"—":Number(n).toFixed(1)+"%";
const iso=(d:Date)=>d.toISOString().slice(0,10);
const imgFor=(name:string)=>icons[name];
function Img({name,large=false}:{name:string;large?:boolean}){return <span className={"appIcon"+(large?" large":"")}><img src={imgFor(name)||""} alt="" onError={e=>{(e.currentTarget as HTMLImageElement).style.display="none"}}/><span className="fallbackIcon"><Icon t="layers" s={large?19:15}/></span></span>}
function rangeFor(v:string){const now=new Date(),today=iso(now);if(v==="week"){const d=new Date(now);const day=d.getDay()||7;d.setDate(d.getDate()-day+1);return[iso(d),today]}if(v==="7"){const d=new Date(now);d.setDate(d.getDate()-6);return[iso(d),today]}if(v==="14"){const d=new Date(now);d.setDate(d.getDate()-13);return[iso(d),today]}if(v==="month")return[today.slice(0,8)+"01",today];return null}
function Tip({active,payload,label}:any){if(!active||!payload?.length)return null;return <div className="tip"><b>{label}</b>{payload.map((p:any)=><div key={p.dataKey}><i style={{background:p.color}}/><span>{p.name}</span><em>{money(p.value)}</em></div>)}</div>}

export default function Overview(){
 const router=useRouter();const r0=rangeFor("7")!;
 const[d,setD]=useState<any>(null),[err,setErr]=useState(""),[loading,setLoading]=useState(true),[start,setStart]=useState(r0[0]),[end,setEnd]=useState(r0[1]),[preset,setPreset]=useState("7"),[theme,setTheme]=useState("light"),[nav,setNav]=useState(false),[q,setQ]=useState("");
 const load=async(s=start,e=end)=>{try{setLoading(true);setErr("");const r=await fetch("/api/overview?"+new URLSearchParams({start:s,end:e}),{cache:"no-store"});const j=await r.json();if(!r.ok)throw Error(j.error);setD(j)}catch(e:any){setErr(e.message||"Unable to load overview")}finally{setLoading(false)}};
 useEffect(()=>{const t=localStorage.getItem("ir-theme")||(matchMedia("(prefers-color-scheme:dark)").matches?"dark":"light");setTheme(t)},[]);
 useEffect(()=>{document.documentElement.dataset.theme=theme;localStorage.setItem("ir-theme",theme)},[theme]);
 useEffect(()=>{load(start,end)},[]);
 const apps=useMemo(()=>((d?.apps)||[]).filter((a:any)=>a.name.toLowerCase().includes(q.toLowerCase())),[d,q]);
 const applyPreset=(v:string)=>{setPreset(v);const x=rangeFor(v);if(x){setStart(x[0]);setEnd(x[1]);load(x[0],x[1])}};
 if(!d&&!err)return <div className="center"><div className="card state"><div className="spinner"/><b>Loading revenue overview</b><span>Preparing all app intelligence…</span></div></div>;
 if(err&&!d)return <div className="center"><div className="card state"><Icon t="alert" s={22}/><b>Unable to load overview</b><span>{err}</span><button className="btn primary" onClick={()=>load(start,end)}>Retry</button></div></div>;
 return <div className="app"><div className={"scrim"+(nav?" show":"")} onClick={()=>setNav(false)}/>
  <aside className={"sidebar"+(nav?" open":"")}><div className="brand"><div className="logo">IR</div><div><b>Invalid Revenue</b><small>Revenue Intelligence</small></div></div>
   <div className="search"><Icon t="search" s={14}/><input placeholder="Search apps…" value={q} onChange={e=>setQ(e.target.value)}/></div>
   <div className="sideHeading">Workspace<span>{apps.length}</span></div>
   <nav><button className="active" onClick={()=>setNav(false)}><Icon t="layers" s={17}/><span className="appName">Overview</span><span className="navChevron"><Icon t="arrow" s={14}/></span></button>
    {apps.map((a:any)=><button key={a.id} onClick={()=>{setNav(false);router.push("/apps/"+a.id)}}><Img name={a.name}/><span className="appName">{a.name}</span><span className="navChevron"><Icon t="arrow" s={14}/></span></button>)}</nav>
   <div className="sideFoot"><span className="live"/>Live revenue workspace</div>
  </aside>
  <main><header><div className="hLeft"><button className="icon mobile" onClick={()=>setNav(true)}><Icon t="menu"/></button><div className="crumb">Workspace<span>/</span><b>Overview</b></div></div>
   <div className="hRight"><button className="icon" onClick={()=>setTheme(theme==="dark"?"light":"dark")}><Icon t={theme==="dark"?"sun":"moon"}/></button><button className="btn" onClick={()=>load(start,end)}><Icon t="refresh" s={14}/>{loading?"Refreshing…":"Refresh"}</button></div></header>
   <div className="page"><div className="head"><div><span className="eyebrow">Portfolio overview</span><h1>Revenue overview</h1></div>
    <div className="filters"><div className="dateSelect"><span>Custom Date</span><select value={preset} onChange={e=>applyPreset(e.target.value)}><option value="custom">Custom Date</option><option value="week">This week</option><option value="7">Last 7 Days</option><option value="14">Last 14 Days</option><option value="month">This Month</option></select></div>
     <label className="dateField"><span>From</span><input type="date" value={start} onChange={e=>{setPreset("custom");setStart(e.target.value)}}/></label><span className="dateArrow">→</span><label className="dateField"><span>To</span><input type="date" value={end} onChange={e=>{setPreset("custom");setEnd(e.target.value)}}/></label><button className="btn primary" disabled={loading} onClick={()=>load(start,end)}>{loading?"Applying…":"Apply dates"}</button>
    </div></div>
    <div className={"kpis"+(loading?" busy":"")}><KPI label="Initial revenue" value={money(d.kpis.initial)} meta="All apps · D0 baseline" icon="layers"/><KPI label="Latest revenue" value={money(d.kpis.latest)} meta="All apps · latest snapshot" icon="trend"/><KPI label="Revenue at risk" value={money(d.kpis.risk)} meta="Initial − latest" icon="alert" tone="danger"/><KPI label="Adjustment rate" value={pct(d.kpis.rate)} meta="Risk / initial" icon="trend" tone="danger"/><KPI label="Apps with risk" value={String(d.kpis.affectedApps)} meta={"of "+d.kpis.apps+" apps"} icon="layers"/></div>
    <section className="card pad24"><div className="cardHead"><div><h2>All app revenue</h2></div></div>
     <div className="overviewGrid">{apps.map((app:any)=><OverviewCard key={app.id} app={app} onOpen={()=>router.push("/apps/"+app.id)}/>)}</div>
    </section>
   </div>
  </main>
  {loading&&<div className="loadingOverlay" aria-live="polite"><div className="loadingOrb"><span/></div><b>Updating overview</b></div>}
 </div>
}
function KPI({label,value,meta,icon,tone}:{label:string;value:string;meta:string;icon:string;tone?:string}){return <div className={"kpi "+(tone||"")}><div className="kpiTop"><span>{label}</span><div className="kpiIcon"><Icon t={icon} s={15}/></div></div><b>{value}</b><small>{meta}</small></div>}
function OverviewCard({app,onOpen}:{app:any;onOpen:()=>void}){const base=Number(app.dayTotals?.d0||0);return <article className="overviewApp card" onClick={onOpen}>
 <div className="overviewTop"><div className="appId"><Img name={app.name} large/><div><span className="eyebrow">App</span><h3>{app.name}</h3></div></div><div className="overviewRisk"><Status value={app.status}/><b className={app.loss>0?"danger":""}>{money(app.loss)}</b><span>at risk</span></div></div>
 <div className="journey">{days.map((x,i)=>{const v=app.dayTotals?.["d"+i]??null;return <div className="journeyStep" key={x}><div className="stepCard"><div className="stepHead"><span>{x}</span><b>{v==null?"—":money(v)}</b></div><div className="bar"><div style={{width:base&&v!=null?Math.max(4,v/base*100)+"%":"0%",background:colors[i]}}/></div><small>{v==null?"No snapshot":i===0?"Baseline":base?((v/base)*100).toFixed(1)+"% of D0":"—"}</small></div>{i<4&&<div className="journeyArrow"><span/><Icon t="arrow" s={17}/></div>}</div>})}</div>
 <div className="summary"><div><span>Initial</span><b>{money(app.initial)}</b></div><div><span>Latest</span><b>{money(app.latest)}</b></div><div><span>Adjustment</span><b className={app.loss>0?"danger":""}>{pct(app.rate)}</b></div></div>
 </article>}
function Status({value}:{value:string}){return <span className={"badge "+String(value).toLowerCase()}><i/>{value}</span>}