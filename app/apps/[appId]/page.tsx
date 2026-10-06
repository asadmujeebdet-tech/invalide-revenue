"use client";
import {useEffect,useMemo,useState} from "react";
import {useParams,useRouter} from "next/navigation";
import {ResponsiveContainer,AreaChart,Area,BarChart,Bar,XAxis,YAxis,Tooltip,CartesianGrid,Cell} from "recharts";

const days=["D0","D1","D2","D3","D4"];
const colors=["var(--c0)","var(--c1)","var(--c2)","var(--c3)","var(--c4)"];
const icons:any={
"All Video Downloader X":"https://lh3.googleusercontent.com/drJQsOnb3KqJhJCs-CWjNfS6ajomyaNSRj1rkLuUJdmUq8FsMix4Enc0MBHb6veYdmqM2NJDGg=s32",
"Phone Cleaner Junk Remover":"https://lh3.googleusercontent.com/m36tGO36s9u1IsS9RmhdNj24BQpBxsTcWFZdV1su174oNmJ5_3YGAoywi7wMFZ99FVGhddEwTw=s32",
"Phone Cleaner - Junk Remover":"https://lh3.googleusercontent.com/m36tGO36s9u1IsS9RmhdNj24BQpBxsTcWFZdV1su174oNmJ5_3YGAoywi7wMFZ99FVGhddEwTw=s32",
"Antivirus - Clean Virus, Junk":"https://lh3.googleusercontent.com/dfkVj-KpDvNMM3XJCF7zn7hWEn6gpQDcf6zEe21cjCrxEIWRAho97Ah2RX7ot5eYhOxYreH1oQ=s32",
"Antivirus Cleaner Pro":"https://lh3.googleusercontent.com/dfkVj-KpDvNMM3XJCF7zn7hWEn6gpQDcf6zEe21cjCrxEIWRAho97Ah2RX7ot5eYhOxYreH1oQ=s32",
"Phone - Junk Cleaner":"https://lh3.googleusercontent.com/4-2u2EQbcRAB9xhTFb7ij3SPQN2M5FnH7FHn6E5o5wcaMM82uBezVSZYlWI8nhnINTmz5IsKPg=s32",
"GPS Map Location: Route Finder":"https://lh3.googleusercontent.com/QniK9fEnkQYFAtVWFMr6Ac1_yGo56wxyZ5cQ3jhjWe-5V62-Tc8sl9RYXchskZuXXjFZwOlw=s32",
"GPS Maps & 3D Navigation":"https://lh3.googleusercontent.com/8wIYbFKhuCBcC6G0Xsd-QrLOMlT6RDDs1FzevOiXkC8k_v_ceXdP780whZUTlQSNr4kooL-_VBY=s32",
"GPS Navigation Map Route Find":"https://lh3.googleusercontent.com/H6-KSAi9SjudiEwT5HplOJ0dauusCC3CzR5u4gAfwaNqnZe_iDbOJBE8BdfXFThku188Q1F4=s32",
"GPS Navigation: Satellite View":"https://lh3.googleusercontent.com/6yVUa1FnofKnlis40fQ9LqrrmCdLnTR2SsfY7w8N-rj-DinRjVRASFFE6XT3aA1-O5vo2-eNBw=s32"
};
const ico:any={menu:"M3 6h18M3 12h18M3 18h18",search:"M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM21 21l-4.3-4.3",refresh:"M20 11a8 8 0 1 0 1 2M20 4v7h-7",moon:"M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z",sun:"M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10zM12 1v2M12 21v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M1 12h2M21 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4",download:"M12 3v12m0 0-4-4m4 4 4-4M4 21h16",arrow:"M5 12h14m-6-6 6 6-6 6",alert:"M12 9v4m0 4h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z",trend:"M3 17l6-6 4 4 8-8",layers:"M12 2 2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5",close:"M6 6l12 12M18 6 6 18"};
const Icon=({t,s=16}:{t:string;s?:number})=><svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d={ico[t]||ico.layers}/></svg>;
const money=(n:any)=>new Intl.NumberFormat("en-US",{style:"currency",currency:"USD",notation:"compact",maximumFractionDigits:1}).format(Number(n)||0);
const pct=(n:any)=>n==null?"—":Number(n).toFixed(1)+"%";
const iso=(d:Date)=>d.toISOString().slice(0,10);
const imgFor=(name:string)=>icons[name];

function Status({value}:{value:string}){return <span className={"badge "+String(value).toLowerCase()}><i/>{value}</span>}
function Img({name,large=false}:{name:string;large?:boolean}){return <span className={"appIcon"+(large?" large":"")}><img src={imgFor(name)||""} alt="" onError={e=>{(e.currentTarget as HTMLImageElement).style.display="none"}}/><span className="fallbackIcon"><Icon t="layers" s={large?19:15}/></span></span>}
function Tip({active,payload,label}:any){if(!active||!payload?.length)return null;return <div className="tip"><b>{label}</b>{payload.map((p:any)=><div key={p.dataKey}><i style={{background:p.color}}/><span>{p.name}</span><em>{money(p.value)}</em></div>)}</div>}

function rangeFor(v:string){
 const now=new Date(),today=iso(now);
 if(v==="week"){const d=new Date(now);const day=d.getDay()||7;d.setDate(d.getDate()-day+1);return [iso(d),today]}
 if(v==="7"){const d=new Date(now);d.setDate(d.getDate()-6);return [iso(d),today]}
 if(v==="14"){const d=new Date(now);d.setDate(d.getDate()-13);return [iso(d),today]}
 if(v==="month"){return [today.slice(0,8)+"01",today]}
 return null;
}

export default function AppRevenuePage(){
 const params=useParams<{appId:string}>(),router=useRouter(),appId=String(params.appId);
 const initialRange=rangeFor("7")!,
 [d,setD]=useState<any>(null),[err,setErr]=useState(""),[loading,setLoading]=useState(true),[start,setStart]=useState(initialRange[0]),[end,setEnd]=useState(initialRange[1]),[preset,setPreset]=useState("7"),[theme,setTheme]=useState("light"),[nav,setNav]=useState(false),[q,setQ]=useState(""),[panel,setPanel]=useState<any>(null),[on,setOn]=useState([true,true,true,true,true]);
 const load=async(s=start,e=end)=>{try{setLoading(true);setErr("");const r=await fetch("/api/dashboard?"+new URLSearchParams({start:s,end:e,appId}),{cache:"no-store"});const j=await r.json();if(!r.ok)throw Error(j.error);setD(j)}catch(e:any){setErr(e.message||"Unable to load dashboard")}finally{setLoading(false)}};
 useEffect(()=>{const t=localStorage.getItem("ir-theme")||(matchMedia("(prefers-color-scheme:dark)").matches?"dark":"light");setTheme(t)},[]);
 useEffect(()=>{document.documentElement.dataset.theme=theme;localStorage.setItem("ir-theme",theme)},[theme]);
 useEffect(()=>{if(start&&end)load(start,end)},[appId]);
 const apps=useMemo(()=>((d?.filters?.apps)||[]).filter((a:any)=>a.name.toLowerCase().includes(q.toLowerCase())),[d,q]);
 const app=d?.apps?.[0];
 const applyPreset=(v:string)=>{setPreset(v);const r=rangeFor(v);if(r){setStart(r[0]);setEnd(r[1]);load(r[0],r[1])}};
 const applyDates=()=>load(start,end);
 if(!d&&!err)return <div className="center"><div className="card state"><div className="spinner"/><b>Loading revenue intelligence</b><span>Preparing the selected app workspace…</span></div></div>;
 if(err&&!d)return <div className="center"><div className="card state"><Icon t="alert" s={22}/><b>Unable to load workspace</b><span>{err}</span><button className="btn primary" onClick={()=>load(start,end)}>Retry</button></div></div>;
 if(!app)return <div className="center"><div className="card state"><b>App not found</b><span>This app has no revenue data for the selected period.</span></div></div>;
 const ret=(d.retention||[]).map((r:any)=>({name:"D"+r.day,revenue:r.revenue,retention:r.retention}));
 const exportCsv=()=>{const rows=d.adUnits||[],head=["Date","Ad unit",...days,"At risk"];const all=rows.flatMap((ad:any)=>Object.entries(d.adDaily?.[String(ad.id)]||{}).map(([date,v]:any)=>[date,ad.name,...days.map((_,i)=>v["d"+i]??""),ad.loss]));const blob=new Blob([[head,...all].map((r:any)=>r.map((x:any)=>JSON.stringify(x??"")).join(",")).join("\n")],{type:"text/csv"});const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=app.name+"_revenue.csv";a.click();URL.revokeObjectURL(a.href)};
 return <div className="app">
  <div className={"scrim"+(nav?" show":"")} onClick={()=>setNav(false)}/>
  <aside className={"sidebar"+(nav?" open":"")}>
   <div className="brand"><div className="logo">IR</div><div><b>Invalid Revenue</b><small>Revenue Intelligence</small></div></div>
   <div className="search"><Icon t="search" s={14}/><input placeholder="Search apps…" value={q} onChange={e=>setQ(e.target.value)}/></div>
   <div className="sideHeading">Workspace<span>{apps.length}</span></div>
   <nav><button onClick={()=>{setNav(false);router.push("/apps")}}><Icon t="layers" s={17}/><span className="appName">Overview</span><span className="navChevron"><Icon t="arrow" s={14}/></span></button>{apps.map((a:any)=><button key={a.id} className={String(a.id)===appId?"active":""} onClick={()=>{setNav(false);router.push("/apps/"+a.id)}}><Img name={a.name}/><span className="appName">{a.name}</span><span className="navChevron"><Icon t="arrow" s={14}/></span></button>)}</nav>
   <div className="sideFoot"><span className="live"/>Live revenue workspace</div>
  </aside>
  <main>
   <header><div className="hLeft"><button className="icon mobile" onClick={()=>setNav(true)}><Icon t="menu"/></button><div className="crumb">Apps<span>/</span><b>{app.name}</b></div></div>
    <div className="hRight"><button className="icon" onClick={()=>setTheme(theme==="dark"?"light":"dark")}><Icon t={theme==="dark"?"sun":"moon"}/></button><button className="btn" onClick={exportCsv}><Icon t="download" s={14}/>Export CSV</button><button className="btn" onClick={()=>load(start,end)}><Icon t="refresh" s={14}/>{loading?"Refreshing…":"Refresh"}</button></div>
   </header>
   <div className="page">
    <div className="head singleRow"><div className="titleRow"><Img name={app.name} large/><div><span className="eyebrow">App revenue workspace</span><h1>{app.name}</h1></div></div>
      <div className="filters">
       <div className="dateSelect"><span>Custom Date</span><select value={preset} onChange={e=>applyPreset(e.target.value)}><option value="custom">Custom Date</option><option value="week">This week</option><option value="7">Last 7 Days</option><option value="14">Last 14 Days</option><option value="month">This Month</option></select></div>
       <label className="dateField"><span>From</span><input type="date" value={start} onChange={e=>{setPreset("custom");setStart(e.target.value)}}/></label>
       <span className="dateArrow">→</span>
       <label className="dateField"><span>To</span><input type="date" value={end} onChange={e=>{setPreset("custom");setEnd(e.target.value)}}/></label>
       <button className="btn primary" disabled={loading} onClick={applyDates}>{loading?"Applying…":"Apply dates"}</button>
      </div>
    </div>
    {err&&<div className="alert"><Icon t="alert"/>{err}</div>}
    <div className={"kpis"+(loading?" busy":"")}><KPI label="Initial revenue" value={money(d.kpis.initial)} meta="D0 baseline" icon="layers"/><KPI label="Latest revenue" value={money(d.kpis.latest)} meta="Latest snapshot" icon="trend"/><KPI label="Revenue at risk" value={money(d.kpis.risk)} meta="Initial − latest" icon="alert" tone="danger"/><KPI label="Adjustment rate" value={pct(d.kpis.rate)} meta="Risk / initial" icon="trend" tone="danger"/><KPI label="Ad units with risk" value={String(d.kpis.affectedAdUnits)} meta="Selected dates" icon="layers"/></div>
    <div className="grid2">
     <section className="card pad24"><div className="cardHead"><div><h2>Revenue by revenue date</h2></div><div className="chips">{days.map((x,i)=><button key={x} className={on[i]?"on":""} style={{"--chip":colors[i]} as any} onClick={()=>setOn(on.map((v,j)=>j===i?!v:v))}><i/>{x}</button>)}</div></div>
      <div className="chart"><ResponsiveContainer width="100%" height="100%"><AreaChart data={d.trend} margin={{top:8,right:8,left:-8,bottom:0}}><CartesianGrid vertical={false} stroke="var(--line)" strokeDasharray="3 4"/><XAxis dataKey="date" tickFormatter={v=>String(v).slice(5)} tickLine={false} axisLine={false} tick={{fill:"var(--faint)",fontSize:11}} minTickGap={24}/><YAxis tickFormatter={v=>money(v)} tickLine={false} axisLine={false} tick={{fill:"var(--faint)",fontSize:11}} width={56}/><Tooltip content={<Tip/>}/>{days.map((x,i)=>on[i]&&<Area key={x} type="monotone" dataKey={"d"+i} name={x} stroke={colors[i]} strokeWidth={2} fillOpacity={0.08} fill={colors[i]} dot={false} connectNulls/>)}</AreaChart></ResponsiveContainer></div>
     </section>
     <section className="card pad24"><div className="cardHead"><div><h2>Revenue retention</h2><p>Share of D0 revenue by snapshot day</p></div></div><div className="chart sm"><ResponsiveContainer width="100%" height="100%"><BarChart data={ret} margin={{top:8,right:0,left:0,bottom:0}}><CartesianGrid vertical={false} stroke="var(--line)" strokeDasharray="3 4"/><XAxis dataKey="name" tickLine={false} axisLine={false} tick={{fill:"var(--faint)",fontSize:11}}/><YAxis hide/><Tooltip content={<Tip/>}/><Bar dataKey="revenue" name="Revenue" radius={[6,6,0,0]} label={{position:"top",fill:"var(--text)",fontSize:11,fontWeight:650,formatter:(v:any)=>money(v)}}>{ret.map((_:any,i:number)=><Cell key={i} fill={colors[i]}/>)}</Bar></BarChart></ResponsiveContainer></div><div className="retRow">{ret.map((r:any)=><div key={r.name}><span>{r.name}</span><b>{pct(r.retention)}</b></div>)}</div></section>
    </div>
    <section className="card appCard"><div className="appTop"><div className="appId"><Img name={app.name} large/><div><span className="eyebrow">Selected app</span><h3>{app.name}</h3><span>{d.adUnits.length} ad units in selected period</span></div></div><div className="appRight"><div><span>Revenue at risk</span><b className={app.loss>0?"danger":""}>{money(app.loss)}</b></div><Status value={app.status}/></div></div>
     <div className="journey">{days.map((x,i)=>{const v=d.appDayTotals?.[String(app.id)]?.["d"+i]??null;const base=d.appDayTotals?.[String(app.id)]?.d0||0;return <div className="journeyStep" key={x}><div className="stepCard"><div className="stepHead"><span>{x}</span><b>{v==null?"—":money(v)}</b></div><div className="bar"><div style={{width:base&&v!=null?Math.max(4,v/base*100)+"%":"0%",background:colors[i]}}/></div><small>{v==null?"No snapshot":i===0?"Baseline":base?((v/base)*100).toFixed(1)+"% of D0":"—"}</small></div>{i<4&&<div className="journeyArrow"><span/><Icon t="arrow" s={17}/></div>}</div>})}</div>
     <div className="summary"><div><span>Initial</span><b>{money(app.initial)}</b></div><div><span>Latest</span><b>{money(app.latest)}</b></div><div><span>Adjustment</span><b className={app.loss>0?"danger":""}>{pct(app.rate)}</b></div></div>
     <AdTable app={app} adUnits={d.adUnits} adDaily={d.adDaily} onOpen={(ad:any)=>setPanel({ad,app})}/>
    </section>
   </div>
  </main>
  {panel&&<AdPanel ad={panel.ad} app={panel.app} daily={d.adDaily?.[String(panel.ad.id)]||{}} onClose={()=>setPanel(null)}/>}
 </div>
}

function KPI({label,value,meta,icon,tone}:{label:string;value:string;meta:string;icon:string;tone?:string}){return <div className={"kpi "+(tone||"")}><div className="kpiTop"><span>{label}</span><div className="kpiIcon"><Icon t={icon} s={15}/></div></div><b>{value}</b><small>{meta}</small></div>}

function AdTable({app,adUnits,adDaily,onOpen}:{app:any;adUnits:any[];adDaily:any;onOpen:(ad:any)=>void}){
 const[page,setPage]=useState(1),[sort,setSort]=useState({k:"date",dir:-1});
 const rows=adUnits.flatMap((ad:any)=>Object.entries(adDaily?.[String(ad.id)]||{}).map(([date,v]:any)=>{const last=[v.d4,v.d3,v.d2,v.d1].find((x:any)=>x!=null);return{ad,date,v,loss:v.d0&&last!=null?Math.max(0,v.d0-last):0}}));
 const val=(r:any,k:string)=>k==="date"?r.date:k==="name"?r.ad.name.toLowerCase():k==="loss"?r.loss:(r.v[k]??-1);
 const pageSize=8;
 const sorted=[...rows].sort((a,b)=>{const x=val(a,sort.k),y=val(b,sort.k);return(x>y?1:x<y?-1:0)*sort.dir});
 const pageCount=Math.max(1,Math.ceil(sorted.length/pageSize));
 const shown=sorted.slice((page-1)*pageSize,page*pageSize);
 const toggle=(k:string)=>{setSort(s=>s.k===k?{k,dir:-s.dir}:{k,dir:k==="date"||k==="name"?1:-1});setPage(1)};
 const cols:[string,string][]=[["date","Date"],["name","Ad unit"],...days.map((x,i):[string,string]=>["d"+i,x]),["loss","At risk"]];
 return <div className="adBlock"><div className="adHead"><div><b>Ad units</b><span className="pill">{rows.length} rows</span></div></div>{rows.length?<><div className="tableWrap"><table><thead><tr>{cols.map(([k,l])=><th key={k} className={(k[0]==="d"||k==="loss"?"num ":"")+"sortable"} onClick={()=>toggle(k)}>{l}<span className="sortIc">{sort.k===k?(sort.dir>0?"↑":"↓"):""}</span></th>)}</tr></thead><tbody>{shown.map((r:any,i:number)=><tr key={r.ad.id+r.date+i} className="clickRow" onClick={()=>onOpen(r.ad)}><td className="muted">{r.date}</td><td><b>{r.ad.name}</b></td>{days.map((_,j)=><td key={j} className="num">{r.v["d"+j]==null?"—":money(r.v["d"+j])}</td>)}<td className={"num"+(r.loss>0?" danger":"")}>{r.loss>0?money(r.loss):"—"}</td></tr>)}</tbody></table></div>{pageCount>1&&<div className="pagination"><button className="pageBtn" disabled={page===1} onClick={()=>setPage(p=>p-1)}>Previous</button><span>Page {page} of {pageCount}</span><button className="pageBtn" disabled={page===pageCount} onClick={()=>setPage(p=>p+1)}>Next</button></div>}</>:<div className="empty">No ad-unit revenue in this period.</div>}</div>
}

function AdPanel({ad,app,daily,onClose}:{ad:any;app:any;daily:any;onClose:()=>void}){
 const data=Object.values(daily||{});
 return <><div className="scrim show z50" onClick={onClose}/><aside className="panel"><div className="panelHead"><div><span className="eyebrow">Ad unit · {app.name}</span><h3>{ad.name}</h3></div><button className="icon" onClick={onClose}><Icon t="close"/></button></div><div className="panelBody"><div className="pStats"><div><span>Initial</span><b>{money(ad.initial)}</b></div><div><span>Latest</span><b>{money(ad.latest)}</b></div><div><span>At risk</span><b className={ad.loss>0?"danger":""}>{money(ad.loss)}</b></div><div><span>Adjustment</span><b className={ad.loss>0?"danger":""}>{pct(ad.rate)}</b></div></div><div className="pRow"><span>Severity</span><Status value={ad.status}/></div><h4>Daily snapshots</h4><div className="tableWrap"><table><thead><tr><th>Date</th>{days.map(x=><th key={x} className="num">{x}</th>)}</tr></thead><tbody>{data.reverse().map((r:any,i:number)=><tr key={i}><td className="muted">{r.date}</td>{days.map((_,j)=><td key={j} className="num">{r["d"+j]==null?"—":money(r["d"+j])}</td>)}</tr>)}</tbody></table></div></div></aside></>
}
