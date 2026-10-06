"use client";
import {useEffect,useMemo,useState} from "react";
import {ResponsiveContainer,AreaChart,Area,BarChart,Bar,XAxis,YAxis,Tooltip,CartesianGrid,Cell} from "recharts";

const money=(n:number)=>new Intl.NumberFormat("en-US",{style:"currency",currency:"USD",notation:"compact",maximumFractionDigits:1}).format(n||0);
const pct=(n:any)=>n==null?"—":Number(n).toFixed(1)+"%";
const csv=(name:string,head:string[],rows:any[][])=>{const esc=(x:any)=>'"'+String(x??"").replace(/"/g,'""')+'"';const b=new Blob([[head,...rows].map(r=>r.map(esc).join(",")).join("\n")],{type:"text/csv"});const a=document.createElement("a");a.href=URL.createObjectURL(b);a.download=name;a.click();URL.revokeObjectURL(a.href)};
const days=["D0","D1","D2","D3","D4"];
const colors=["var(--c0)","var(--c1)","var(--c2)","var(--c3)","var(--c4)"];
const ico:any={app:"M4 4h16v16H4z M8 9h8M8 13h8M8 17h5",refresh:"M20 11a8 8 0 1 0 1 2 M20 4v7h-7",arrow:"M5 12h14m-6-6 6 6-6 6",search:"M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16z M21 21l-4.3-4.3",sun:"M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10z M12 1v2M12 21v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M1 12h2M21 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4",moon:"M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z",alert:"M12 9v4m0 4h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z",trend:"M3 17l6-6 4 4 8-8M15 7h6v6",layers:"M12 2 2 7l10 5 10-5-10-5z M2 17l10 5 10-5M2 12l10 5 10-5",down:"M6 9l6 6 6-6",menu:"M3 6h18M3 12h18M3 18h18",download:"M12 3v12m0 0-4-4m4 4 4-4M4 21h16",close:"M6 6l12 12M18 6 6 18",sort:"M8 9l4-4 4 4M8 15l4 4 4-4"};
const Icon=({t,s=16}:{t:string;s?:number})=><svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d={ico[t]||ico.app}/></svg>;
const Status=({value}:{value:string})=><span className={"badge "+value.toLowerCase()}><i/>{value}</span>;
const Tip=({active,payload,label}:any)=>!active||!payload?.length?null:<div className="tip"><b>{label}</b>{payload.map((p:any)=><div key={p.dataKey}><i style={{background:p.color}}/><span>{p.name}</span><em>{money(p.value)}</em></div>)}</div>;
function KPI({label,value,meta,icon,tone}:{label:string;value:string;meta:string;icon:string;tone?:string}){return <div className={"kpi "+(tone||"")}><div className="kpiTop"><span>{label}</span><div className="kpiIcon"><Icon t={icon} s={15}/></div></div><b>{value}</b><small>{meta}</small></div>}

export default function Dashboard(){
  const[d,setD]=useState<any>();const[err,setErr]=useState("");const[start,setStart]=useState("");const[end,setEnd]=useState("");
  const[loading,setLoading]=useState(false);const[sel,setSel]=useState<string|null>(null);const[q,setQ]=useState("");
  const[theme,setTheme]=useState("light");const[nav,setNav]=useState(false);const[panel,setPanel]=useState<any>(null);const[on,setOn]=useState([true,true,true,true,true]);
  const iso=(x:Date)=>x.toISOString().slice(0,10);
  const load=async(s0?:string,e0?:string)=>{try{setLoading(true);setErr("");const now=new Date(),e=e0||end||iso(now),s=s0||start||iso(new Date(now.getTime()-29*864e5));if(s>e)throw Error("From date cannot be after To date.");const r=await fetch("/api/dashboard?"+new URLSearchParams({start:s,end:e}),{cache:"no-store"});const j=await r.json();if(!r.ok)throw Error(j.error);setD(j);setStart(s);setEnd(e)}catch(e:any){setErr(e.message||"Unable to load dashboard")}finally{setLoading(false)}};
  const preset=(n:number)=>{const now=new Date();load(iso(new Date(now.getTime()-(n-1)*864e5)),iso(now))};
  useEffect(()=>{const t=localStorage.getItem("ir-theme")||(matchMedia("(prefers-color-scheme:dark)").matches?"dark":"light");setTheme(t);load()},[]);
  useEffect(()=>{document.documentElement.dataset.theme=theme;try{localStorage.setItem("ir-theme",theme)}catch{}},[theme]);
  useEffect(()=>{const f=(e:KeyboardEvent)=>e.key==="Escape"&&setPanel(null);addEventListener("keydown",f);return()=>removeEventListener("keydown",f)},[]);
  const apps=useMemo(()=>(d?.apps||[]).filter((a:any)=>a.name.toLowerCase().includes(q.toLowerCase())),[d,q]);
  if(err&&!d)return <div className="center"><div className="card state"><Icon t="alert" s={22}/><b>Unable to load workspace</b><span>{err}</span><button className="btn primary" onClick={()=>load()}>Retry</button></div></div>;
  if(!d)return <div className="center"><div className="card state"><div className="spinner"/><b>Loading Revenue Intelligence</b><span>Connecting to your database…</span></div></div>;
  const k=d.kpis;const jump=(id:string)=>{setSel(id);setNav(false);document.getElementById("app-"+id)?.scrollIntoView({behavior:"smooth",block:"start"})};
  const exportAll=()=>csv("revenue-by-app_"+start+"_"+end+".csv",["App","Initial","Latest","At risk","Adjustment %","Status"],d.apps.map((a:any)=>[a.name,a.initial.toFixed(2),a.latest.toFixed(2),a.loss.toFixed(2),a.rate.toFixed(2),a.status]));
  const ret=(d.retention||[]).map((r:any)=>({name:"D"+r.day,revenue:r.revenue,retention:r.retention}));
  return <div className="app">
    <div className={"scrim"+(nav?" show":"")} onClick={()=>setNav(false)}/>
    <aside className={"sidebar"+(nav?" open":"")}>
      <div className="brand"><div className="logo">IR</div><div><b>Invalid Revenue</b><small>Revenue Intelligence</small></div></div>
      <div className="search"><Icon t="search" s={14}/><input placeholder="Search apps…" value={q} onChange={e=>setQ(e.target.value)}/></div>
      <div className="sideHeading">Apps<span>{apps.length}</span></div>
      <nav>{apps.map((a:any)=><button key={a.id} className={sel===String(a.id)?"active":""} onClick={()=>jump(String(a.id))}><i className={"dot "+a.status.toLowerCase()}/><span className="appName">{a.name}</span><span className="appLoss">{money(a.loss)}</span></button>)}{!apps.length&&<div className="muted pad">No apps match.</div>}</nav>
      <div className="sideFoot"><span className="live"/>Live revenue workspace</div>
    </aside>
    <main>
      <header><div className="hLeft"><button className="icon mobile" onClick={()=>setNav(true)}><Icon t="menu"/></button><div className="crumb">Workspace<span>/</span><b>Revenue Intelligence</b></div></div>
        <div className="hRight"><button className="icon" title="Toggle theme" onClick={()=>setTheme(theme==="dark"?"light":"dark")}><Icon t={theme==="dark"?"sun":"moon"}/></button><button className="btn" onClick={exportAll}><Icon t="download" s={14}/>Export CSV</button><button className="btn" onClick={()=>load()}><span className={loading?"spin":""}><Icon t="refresh" s={14}/></span>{loading?"Refreshing…":"Refresh"}</button></div></header>
      <div className="page">
        <div className="head"><div><span className="eyebrow">Portfolio overview</span><h1>Revenue at a glance</h1><p>Every app, revenue date and D0–D4 snapshot in one place.</p></div>
          <div className="filters"><div className="seg">{[7,30,90].map(n=><button key={n} onClick={()=>preset(n)}>{n}D</button>)}</div><label><input type="date" value={start} onChange={e=>setStart(e.target.value)}/></label><span className="to">→</span><label><input type="date" value={end} onChange={e=>setEnd(e.target.value)}/></label><button className="btn primary" disabled={loading} onClick={()=>load()}>{loading?"Applying…":"Apply"}</button></div></div>
        {err&&<div className="alert"><Icon t="alert"/>{err}</div>}
        <div className={"kpis"+(loading?" busy":"")}>
          <KPI label="Initial revenue" value={money(k.initial)} meta="D0 baseline" icon="layers"/>
          <KPI label="Latest revenue" value={money(k.latest)} meta="Latest snapshot" icon="trend"/>
          <KPI label="Revenue at risk" value={money(k.risk)} meta="Initial − latest" icon="alert" tone="danger"/>
          <KPI label="Adjustment rate" value={pct(k.rate)} meta="Risk / initial" icon="down" tone="danger"/>
          <KPI label="Apps with risk" value={String(k.affectedApps)} meta={"of "+d.apps.length+" apps"} icon="app"/>
          <KPI label="Ad units with risk" value={String(k.affectedAdUnits)} meta="Selected dates" icon="layers"/>
        </div>
        <div className="grid2">
          <section className="card pad24"><div className="cardHead"><div><h2>Revenue by revenue date</h2><p>D0–D4 snapshots across the selected range</p></div><div className="chips">{days.map((x,i)=><button key={x} className={on[i]?"on":""} style={{"--chip":colors[i]} as any} onClick={()=>setOn(on.map((v,j)=>j===i?!v:v))}><i/>{x}</button>)}</div></div>
            <div className="chart"><ResponsiveContainer width="100%" height="100%"><AreaChart data={d.trend} margin={{top:8,right:8,left:-8,bottom:0}}>
              <defs>{colors.map((c,i)=><linearGradient key={i} id={"g"+i} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" style={{stopColor:c,stopOpacity:.22}}/><stop offset="100%" style={{stopColor:c,stopOpacity:0}}/></linearGradient>)}</defs>
              <CartesianGrid vertical={false} stroke="var(--line)" strokeDasharray="3 4"/><XAxis dataKey="date" tickFormatter={v=>String(v).slice(5)} tickLine={false} axisLine={false} tick={{fill:"var(--faint)",fontSize:11}} minTickGap={24}/><YAxis tickFormatter={v=>money(Number(v))} tickLine={false} axisLine={false} tick={{fill:"var(--faint)",fontSize:11}} width={56}/>
              <Tooltip content={<Tip/>} cursor={{stroke:"var(--line)"}}/>
              {days.map((x,i)=>on[i]&&<Area key={x} type="monotone" dataKey={"d"+i} name={x} stroke={colors[i]} strokeWidth={2} fill={"url(#g"+i+")"} dot={false} activeDot={{r:4}} connectNulls/>)}
            </AreaChart></ResponsiveContainer></div></section>
          <section className="card pad24"><div className="cardHead"><div><h2>Revenue retention</h2><p>Share of D0 revenue by snapshot day</p></div></div>
            <div className="chart sm"><ResponsiveContainer width="100%" height="100%"><BarChart data={ret} margin={{top:8,right:0,left:-8,bottom:0}}><CartesianGrid vertical={false} stroke="var(--line)" strokeDasharray="3 4"/><XAxis dataKey="name" tickLine={false} axisLine={false} tick={{fill:"var(--faint)",fontSize:11}}/><YAxis tickFormatter={v=>money(Number(v))} tickLine={false} axisLine={false} tick={{fill:"var(--faint)",fontSize:11}} width={56}/><Tooltip content={<Tip/>} cursor={{fill:"var(--hover)"}}/><Bar dataKey="revenue" name="Revenue" radius={[6,6,0,0]}>{ret.map((_:any,i:number)=><Cell key={i} fill={colors[i]}/>)}</Bar></BarChart></ResponsiveContainer></div>
            <div className="retRow">{ret.map((r:any,i:number)=><div key={i}><span>{r.name}</span><b>{pct(r.retention)}</b></div>)}</div></section>
        </div>
        {!!d.attention?.length&&<section className="card pad24 attn"><div className="cardHead"><div><h2>Needs attention</h2><p>Largest revenue adjustments across apps and ad units</p></div></div>
          <div className="attnGrid">{d.attention.map((x:any,i:number)=><div className="attnItem" key={i}><div><small>{x.type}</small><b>{x.name}</b></div><div className="r"><strong>{money(x.loss)}</strong><Status value={x.status}/></div></div>)}</div></section>}
        <div className="sectionHead"><div><span className="eyebrow">App-by-app intelligence</span><h2>Complete revenue picture</h2></div><span className="pill">{d.apps.length} apps</span></div>
        <div className="appList">{d.apps.map((a:any)=><AppCard key={a.id} app={a} id={"app-"+a.id} active={sel===String(a.id)} adUnits={d.adUnits.filter((x:any)=>String(x.app_id)===String(a.id))} totals={d.appDayTotals[String(a.id)]||{}} adDaily={d.adDaily||{}} onOpen={(ad:any,app:any)=>setPanel({ad,app})}/>)}</div>
      </div>
    </main>{panel&&<AdPanel ad={panel.ad} app={panel.app} daily={d.adDaily?.[String(panel.ad.id)]||{}} onClose={()=>setPanel(null)}/>}</div>}

function AdPanel({ad,app,daily,onClose}:{ad:any;app:any;daily:any;onClose:()=>void}){
  const data=Object.keys(daily).sort().map(date=>({date,...daily[date]}));
  return <><div className="scrim show z50" onClick={onClose}/><aside className="panel" role="dialog" aria-label={ad.name}>
    <div className="panelHead"><div><span className="eyebrow">Ad unit · {app.name}</span><h3>{ad.name}</h3></div><button className="icon" onClick={onClose}><Icon t="close"/></button></div>
    <div className="panelBody"><div className="pStats"><div><span>Initial</span><b>{money(ad.initial)}</b></div><div><span>Latest</span><b>{money(ad.latest)}</b></div><div><span>At risk</span><b className={ad.loss>0?"danger":""}>{money(ad.loss)}</b></div><div><span>Adjustment</span><b className={ad.loss>0?"danger":""}>{pct(ad.rate)}</b></div></div>
      <div className="pRow"><span>Severity</span><Status value={ad.status}/></div>
      <h4>Revenue by date</h4><div className="chart sm"><ResponsiveContainer width="100%" height="100%"><AreaChart data={data} margin={{top:8,right:8,left:-8,bottom:0}}><CartesianGrid vertical={false} stroke="var(--line)" strokeDasharray="3 4"/><XAxis dataKey="date" tickFormatter={v=>String(v).slice(5)} tickLine={false} axisLine={false} tick={{fill:"var(--faint)",fontSize:11}} minTickGap={20}/><YAxis tickFormatter={v=>money(Number(v))} tickLine={false} axisLine={false} tick={{fill:"var(--faint)",fontSize:11}} width={52}/><Tooltip content={<Tip/>}/>{days.map((x,i)=><Area key={x} type="monotone" dataKey={"d"+i} name={x} stroke={colors[i]} fill="none" strokeWidth={2} dot={false} connectNulls/>)}</AreaChart></ResponsiveContainer></div>
      <h4>Daily snapshots</h4><div className="tableWrap"><table><thead><tr><th>Date</th>{days.map(x=><th key={x} className="num">{x}</th>)}<th className="num">Kept</th></tr></thead><tbody>{[...data].reverse().map((r:any)=>{const last=[r.d4,r.d3,r.d2,r.d1].find(x=>x!=null);const kept=r.d0&&last!=null?last/r.d0*100:null;return <tr key={r.date}><td className="muted">{r.date}</td>{days.map((_,i)=><td key={i} className="num">{r["d"+i]==null?"—":money(r["d"+i])}</td>)}<td className={"num"+(kept!=null&&kept<100?" danger":"")}>{pct(kept)}</td></tr>})}</tbody></table></div>
      <button className="btn full" onClick={()=>csv(ad.name+"_snapshots.csv",["Date",...days],data.map((r:any)=>[r.date,...days.map((_,i)=>r["d"+i])]))}><Icon t="download" s={14}/>Export this ad unit</button></div></aside></>}

function AppCard({app,adUnits,totals,adDaily,id,active,onOpen}:{app:any;adUnits:any[];totals:any;adDaily:any;id:string;active:boolean;onOpen:(ad:any,app:any)=>void}){
  const[all,setAll]=useState(false);const[sort,setSort]=useState({k:"date",dir:-1});
  const values=days.map((_,i)=>totals["d"+i]??null);const max=Math.max(...values.map(v=>v||0),1);
  const base=adUnits.flatMap((ad:any)=>Object.keys(adDaily[String(ad.id)]||{}).map(date=>{const v=adDaily[String(ad.id)][date];const last=[v.d4,v.d3,v.d2,v.d1].find((x:any)=>x!=null);return{ad,date,v,name:ad.name as string,loss:v.d0&&last!=null?Math.max(0,v.d0-last):0}}));
  const val=(r:any,k:string)=>k==="date"?r.date:k==="name"?r.name.toLowerCase():k==="loss"?r.loss:(r.v[k]??-1);
  const rows=[...base].sort((a,b)=>{const x=val(a,sort.k),y=val(b,sort.k);return(x>y?1:x<y?-1:0)*sort.dir});const shown=all?rows:rows.slice(0,8);
  const toggle=(k:string)=>setSort(s=>s.k===k?{k,dir:-s.dir}:{k,dir:k==="date"||k==="name"?1:-1});
  const cols:[string,string][]=[["date","Date"],["name","Ad unit"],...days.map((x,i):[string,string]=>["d"+i,x]),["loss","At risk"]];
  return <section className={"card appCard"+(active?" active":"")} id={id}>
    <div className="appTop"><div className="appId"><div className="appIcon"><Icon t="app" s={18}/></div><div><h3>{app.name}</h3><span>{adUnits.length} ad units</span></div></div>
      <div className="appRisk"><span>Revenue at risk</span><b className={app.loss>0?"danger":""}>{money(app.loss)}</b><Status value={app.status}/></div></div>
    <div className="journey">{values.map((v,i)=><div className="step" key={i}><div className="stepHead"><span>{days[i]}</span><b>{v==null?"—":money(v)}</b></div><div className="bar"><div style={{width:v==null?0:Math.max(3,v/max*100)+"%",background:colors[i]}}/></div><small>{v==null?"No snapshot":i===0?"Baseline":values[0]?((v/values[0])*100).toFixed(1)+"% vs D0":"—"}</small></div>)}</div>
    <div className="summary"><div><span>Initial</span><b>{money(app.initial)}</b></div><div><span>Latest</span><b>{money(app.latest)}</b></div><div><span>Adjustment</span><b className={app.loss>0?"danger":""}>{pct(app.rate)}</b></div></div>
    <div className="adBlock"><div className="adHead"><b>Ad units <span className="pill">{rows.length} rows</span></b>{!!rows.length&&<button className="btn sm" onClick={()=>csv(app.name+"_ad-units.csv",["Date","Ad unit",...days,"At risk"],rows.map(r=>[r.date,r.name,...days.map((_,i)=>r.v["d"+i]),r.loss.toFixed(2)]))}><Icon t="download" s={13}/>CSV</button>}</div>
      {rows.length?<><div className="tableWrap"><table><thead><tr>{cols.map(([k,l])=><th key={k} className={(k[0]==="d"&&k!=="date"||k==="loss"?"num ":"")+"sortable"+(sort.k===k?" sorted":"")} onClick={()=>toggle(k)}>{l}<span className="sortIc">{sort.k===k?(sort.dir>0?"↑":"↓"):""}</span></th>)}</tr></thead><tbody>{shown.map(r=>{const bad=r.loss>0;return <tr key={r.ad.id+r.date} className="clickRow" onClick={()=>onOpen(r.ad,app)}><td className="muted">{r.date}</td><td><b>{r.name}</b></td>{days.map((_,i)=><td key={i} className={"num"+(i===4&&bad?" danger":"")}>{r.v["d"+i]==null?"—":money(r.v["d"+i])}</td>)}<td className={"num"+(bad?" danger":"")}>{bad?money(r.loss):"—"}</td></tr>})}</tbody></table></div>
      {rows.length>8&&<button className="more" onClick={()=>setAll(!all)}>{all?"Show less":"Show all "+rows.length+" rows"}</button>}</>:<div className="empty">No ad-unit revenue in this period.</div>}</div>
  </section>}
