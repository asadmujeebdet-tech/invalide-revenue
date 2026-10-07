"use client";
import {useEffect,useMemo,useState} from "react";
import {useParams,useRouter} from "next/navigation";
import {appIconUrl} from "@/lib/appIcons";
import {CountUp,ChevronFlow,useToast,isoLocal,LogoMark,AppLoader} from "@/app/ui";
import {ResponsiveContainer,AreaChart,Area,XAxis,YAxis,Tooltip} from "recharts";

const days=["D0","D1","D2","D3","D4"];
const colors=["var(--c0)","var(--c1)","var(--c2)","var(--c3)","var(--c4)"];
const ico:any={menu:"M3 6h18M3 12h18M3 18h18",search:"M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM21 21l-4.3-4.3",refresh:"M20 11a8 8 0 1 0 1 2M20 4v7h-7",moon:"M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z",sun:"M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10zM12 1v2M12 21v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M1 12h2M21 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4",download:"M12 3v12m0 0-4-4m4 4 4-4M4 21h16",home:"M3 10.5 12 3l9 7.5v9a1.5 1.5 0 0 1-1.5 1.5h-5v-6h-5v6h-5A1.5 1.5 0 0 1 3 19.5z",arrow:"M5 12h14m-6-6 6 6-6 6",alert:"M12 9v4m0 4h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z",trend:"M3 17l6-6 4 4 8-8",layers:"M12 2 2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5",close:"M6 6l12 12M18 6 6 18",check:"M5 12l5 5 9-10"};
const Icon=({t,s=16}:{t:string;s?:number})=><svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d={ico[t]||ico.layers}/></svg>;
const money=(n:any)=>new Intl.NumberFormat("en-US",{style:"currency",currency:"USD",notation:"compact",maximumFractionDigits:1}).format(Number(n)||0); const precise=(n:any)=>n==null?"—":"$"+Number(n).toFixed(6);
const pct=(n:any)=>n==null?"—":Number(n).toFixed(1)+"%";
const spct=(n:any)=>n==null?"—":(n>0?"+":"")+Number(n).toFixed(1)+"%";
const iso=isoLocal; // local date, not UTC (fixes off-by-one near midnight)
const imgFor=(name:string,big=false)=>appIconUrl(name,big?128:64)||"";
const themeFor=(name:string)=>{const n=name.toLowerCase();if(n.includes("antivirus"))return "security";if(n.includes("gps")||n.includes("navigation")||n.includes("map"))return "navigation";if(n.includes("cleaner")||n.includes("junk"))return "cleaner";if(n.includes("video"))return "media";return "finance"};

function Status({value}:{value:string}){return <span className={"badge "+String(value).toLowerCase()}><i/>{value}</span>}
function Img({name,large=false}:{name:string;large?:boolean}){return <span className={"appIcon"+(large?" large":"")}><img src={imgFor(name,large)} alt="" referrerPolicy="no-referrer" onError={e=>{(e.currentTarget as HTMLImageElement).style.display="none"}}/><span className="fallbackIcon"><Icon t="layers" s={large?19:15}/></span></span>}
function Tip({active,payload,label,asPct}:any){if(!active||!payload?.length)return null;return <div className="tip"><b>{label}</b>{payload.map((p:any)=><div key={p.dataKey}><i style={{background:p.color}}/><span>{p.name}</span><em>{asPct?pct(p.value):money(p.value)}</em></div>)}</div>}

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
 [d,setD]=useState<any>(null),[err,setErr]=useState(""),[loading,setLoading]=useState(true),[start,setStart]=useState(initialRange[0]),[end,setEnd]=useState(initialRange[1]),[preset,setPreset]=useState("7"),[theme,setTheme]=useState(()=>typeof window!=="undefined"?(localStorage.getItem("ir-theme")||(matchMedia("(prefers-color-scheme:dark)").matches?"dark":"light")):"light"),[nav,setNav]=useState(false),[q,setQ]=useState(""),[panel,setPanel]=useState<any>(null),[on,setOn]=useState([true,true,true,true,true]);
 const toast=useToast();
 const load=async(s=start,e=end)=>{try{setLoading(true);setErr("");const r=await fetch("/api/dashboard?"+new URLSearchParams({start:s,end:e,appId}),{cache:"no-store"});const j=await r.json();if(!r.ok)throw Error(j.error);setD(j)}catch(e:any){setErr(e.message||"Unable to load dashboard")}finally{setLoading(false)}};
 useEffect(()=>{const t=localStorage.getItem("ir-theme")||(matchMedia("(prefers-color-scheme:dark)").matches?"dark":"light");setTheme(t)},[]);
 useEffect(()=>{document.documentElement.dataset.theme=theme;try{localStorage.setItem("ir-theme",theme)}catch{}},[theme]);
 useEffect(()=>{if(start&&end)load(start,end)},[appId]);
 const apps=useMemo(()=>((d?.filters?.apps)||[]).filter((a:any)=>a.name.toLowerCase().includes(q.toLowerCase())),[d,q]);
 const app=d?.apps?.[0];
 const applyPreset=(v:string)=>{setPreset(v);const r=rangeFor(v);if(r){setStart(r[0]);setEnd(r[1]);load(r[0],r[1])}};
 const applyDates=()=>load(start,end);
 if(!d&&!err)return <AppLoader full title="Loading revenue intelligence"/>;
 if(err&&!d)return <div className="center"><div className="card state"><Icon t="alert" s={22}/><b>Unable to load workspace</b><span>{err}</span><button className="btn primary" onClick={()=>load(start,end)}>Retry</button></div></div>;
 if(!app)return <div className="center"><div className="card state"><b>App not found</b><span>This app has no revenue data for the selected period.</span></div></div>;
 const ret=(d.retention||[]).map((r:any)=>({name:"D"+r.day,revenue:r.revenue,retention:r.retention,dates:r.dates}));
 const exportCsv=()=>{const rows=d.adUnits||[],head=["Date","Ad unit",...days,"At risk"];const all=rows.flatMap((ad:any)=>Object.entries(d.adDaily?.[String(ad.id)]||{}).map(([date,v]:any)=>[date,ad.name,...days.map((_,i)=>v["d"+i]??""),ad.loss]));const blob=new Blob([[head,...all].map((r:any)=>r.map((x:any)=>JSON.stringify(x??"")).join(",")).join("\n")],{type:"text/csv"});const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=app.name+"_revenue.csv";a.click();URL.revokeObjectURL(a.href);toast.show("Exported "+all.length+" rows to CSV")};
 return <div className={"app appTheme-"+themeFor(app.name)}>
  <div className={"scrim"+(nav?" show":"")} onClick={()=>setNav(false)}/>
  <aside className={"sidebar"+(nav?" open":"")}>
   <div className="brand"><div className="logo"><LogoMark/></div><div><b>Invalid Revenue</b><small>Revenue Intelligence</small></div></div>
   <div className="search"><Icon t="search" s={14}/><input placeholder="Search apps…" value={q} onChange={e=>setQ(e.target.value)}/></div>
   <div className="sideHeading">Workspace<span>{apps.length}</span></div>
   <nav><button onClick={()=>{setNav(false);router.push("/apps/overview")}}><Icon t="home" s={17}/><span className="appName">Overview</span><span className="navChevron"><Icon t="arrow" s={14}/></span></button>{apps.map((a:any)=><button key={a.id} className={String(a.id)===appId?"active":""} onClick={()=>{setNav(false);router.push("/apps/"+a.id)}}><Img name={a.name}/><span className="appName">{a.name}</span><span className="navChevron"><Icon t="arrow" s={14}/></span></button>)}</nav>
   <div className="sideFoot"><span className="live"/>Live revenue workspace</div>
  </aside>
  <main>
   <header>{loading&&<div className="topbar"/>}<div className="hLeft"><button className="icon mobile" onClick={()=>setNav(true)}><Icon t="menu"/></button><div className="crumb">Apps<span>/</span><b>{app.name}</b></div></div>
    <div className="hRight"><button className="icon" onClick={()=>setTheme(theme==="dark"?"light":"dark")}><Icon t={theme==="dark"?"sun":"moon"}/></button><button className="btn" onClick={()=>load(start,end)}><Icon t="refresh" s={14}/>{loading?"Refreshing…":"Refresh"}</button></div>
   </header>
   <div className="page" key={appId}>
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
    <div className={"kpis"+(loading?" busy":"")}><KPI label="Initial revenue" value={<CountUp n={d.kpis.initial} f={money}/>} meta="D0 baseline" icon="layers"/><KPI label="Latest revenue" value={<CountUp n={d.kpis.latest} f={money}/>} meta="Latest snapshot" icon="trend"/><KPI label="Revenue at risk" value={<CountUp n={d.kpis.risk} f={money}/>} meta="Initial − latest" icon="alert" tone="danger"/><KPI label="Adjustment %" value={<CountUp n={d.kpis.adjustmentPct??0} f={spct}/>} meta="(Latest − Initial) / Initial" icon="trend" tone={(d.kpis.adjustment||0)<0?"danger":""}/></div>
    <section className="card pad24"><div className="cardHead"><div><h2>Revenue by revenue date</h2><p>Dashed line = final available snapshot for each date</p></div><div className="chips">{days.map((x,i)=><button key={x} className={on[i]?"on":""} style={{"--chip":colors[i]} as any} onClick={()=>setOn(on.map((v,j)=>j===i?!v:v))}><i/>{x}</button>)}</div></div>
      <div className="chart"><ResponsiveContainer width="100%" height="100%"><AreaChart data={d.trend} margin={{top:8,right:8,left:-8,bottom:0}}><XAxis dataKey="date" tickFormatter={v=>String(v).slice(5)} tickLine={false} axisLine={false} tick={{fill:"var(--faint)",fontSize:11}} minTickGap={24}/><YAxis tickFormatter={v=>money(v)} tickLine={false} axisLine={false} tick={{fill:"var(--faint)",fontSize:11}} width={56}/><Tooltip content={<Tip/>}/>{days.map((x,i)=>on[i]&&<Area key={x} type="monotone" dataKey={"d"+i} name={x} stroke={colors[i]} strokeWidth={2} fillOpacity={0.08} fill={colors[i]} dot={false} activeDot={{r:4}} animationDuration={1000} animationEasing="ease-out" connectNulls/>)}<Area type="monotone" dataKey="latest" name="Final" stroke="var(--text)" strokeWidth={2.5} strokeDasharray="5 4" fill="none" dot={false} animationDuration={1000} connectNulls/></AreaChart></ResponsiveContainer></div>
     </section>
    <section className="card appCard"><div className="appTop"><div className="appId"><Img name={app.name} large/><div><span className="eyebrow">Selected app</span><h3>{app.name}</h3><span>{d.adUnits.length} ad units in selected period</span></div></div><div className="appRight"><div><span>Revenue at risk</span><b className={app.loss>0?"danger":""}>{money(app.loss)}</b></div><Status value={app.status}/></div></div>
     <ChevronFlow rows={d.trend||[]} note={false}/>
     <div className="summary"><div><span>Initial</span><b>{money(app.initial)}</b></div><div><span>Latest</span><b>{money(app.latest)}</b></div><div><span>Adjustment</span><b className={app.loss>0?"danger":""}>{pct(app.rate)}</b></div></div>
     <SnapshotTable trend={d.trend||[]}/>
     <AdTable adUnits={d.adUnits} adDaily={d.adDaily} onOpen={(ad:any)=>setPanel({ad,app})}/>
    </section>
   </div>
  </main>
  {toast.node}
  {loading&&String(app.id)!==appId&&(()=>{const n=(d.filters?.apps||[]).find((a:any)=>String(a.id)===appId)?.name;return <AppLoader name={n} title={n?"Loading "+n:"Loading app"}/>})()}
  {panel&&<AdPanel ad={panel.ad} app={panel.app} daily={d.adDaily?.[String(panel.ad.id)]||{}} onClose={()=>setPanel(null)}/>}
 </div>
}

function KPI({label,value,meta,icon,tone}:{label:string;value:any;meta:string;icon:string;tone?:string}){return <div className={"kpi "+(tone||"")}><div className="kpiTop"><span>{label}</span><div className="kpiIcon"><Icon t={icon} s={15}/></div></div><b>{value}</b><small>{meta}</small></div>}

function SearchBox({value,onChange,placeholder}:{value:string;onChange:(v:string)=>void;placeholder:string}){return <div className="tableSearch"><Icon t="search" s={14}/><input value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder}/></div>}

function AdTable({adUnits,adDaily,onOpen}:{adUnits:any[];adDaily:any;onOpen:(ad:any)=>void}){
 const[page,setPage]=useState(1),[sort,setSort]=useState({k:"date",dir:-1}),[q,setQ]=useState("");
 const rows=adUnits.flatMap((ad:any)=>Object.entries(adDaily?.[String(ad.id)]||{}).map(([date,v]:any)=>{const last=[v.d4,v.d3,v.d2,v.d1].find((x:any)=>x!=null);return{ad,date,v,loss:v.d0!=null&&last!=null?Math.max(0,v.d0-last):0,adj:v.d0!=null&&last!=null?(last-v.d0)/v.d0*100:null}})).filter((r:any)=>r.ad.name.toLowerCase().includes(q.toLowerCase())||r.date.includes(q));
 const val=(r:any,k:string)=>k==="date"?r.date:k==="name"?r.ad.name.toLowerCase():k==="loss"?r.loss:(r.v[k]??-1);
 const pageSize=8,maxLoss=Math.max(1,...rows.map((r:any)=>r.loss));
 const sorted=[...rows].sort((a,b)=>{const x=val(a,sort.k),y=val(b,sort.k);return(x>y?1:x<y?-1:0)*sort.dir});
 const pageCount=Math.max(1,Math.ceil(sorted.length/pageSize)),shown=sorted.slice((page-1)*pageSize,page*pageSize);
 const toggle=(k:string)=>{setSort(s=>s.k===k?{k,dir:-s.dir}:{k,dir:k==="date"||k==="name"?1:-1});setPage(1)};
 const cols:[string,string][]=[["date","Date"],["name","Ad unit"],...days.map((x,i):[string,string]=>["d"+i,x]),["loss","At risk"]];
 return <div className="adBlock"><div className="adHead"><div className="adTitle"><b>Ad units</b><span className="countBadge">{rows.length} rows</span></div><SearchBox value={q} onChange={v=>{setQ(v);setPage(1)}} placeholder="Search ad units…"/></div>{rows.length?<><div className="tableWrap"><table><thead><tr>{cols.map(([k,l])=><th key={k} className={(/^d\d$/.test(k)||k==="loss"?"num ":"")+"sortable"+(sort.k===k?" sorted":"")} onClick={()=>toggle(k)}>{l}<span className="sortIc">{sort.k===k?(sort.dir>0?"↑":"↓"):""}</span></th>)}</tr></thead><tbody>{shown.map((r:any,i:number)=><tr key={r.ad.id+r.date+i} className="clickRow rowIn" style={{animationDelay:i*30+"ms"}} onClick={()=>onOpen(r.ad)}><td className="muted">{r.date}</td><td><b>{r.ad.name}</b></td>{days.map((_,j)=><td key={j} className="num">{r.v["d"+j]==null?"—":precise(r.v["d"+j])}</td>)}<td className={"num heatCell"+(r.loss>0?" danger":"")}><i className="heat" style={{width:(r.loss/maxLoss*100)+"%"}}/><span>{r.loss>0?precise(r.loss):"—"}</span></td></tr>)}</tbody></table></div>{pageCount>1&&<div className="pagination"><button className="pageBtn" disabled={page===1} onClick={()=>setPage(p=>p-1)}>Previous</button><span>Page {page} of {pageCount}</span><button className="pageBtn" disabled={page===pageCount} onClick={()=>setPage(p=>p+1)}>Next</button></div>}</>:<div className="empty">No ad-unit revenue in this period.</div>}</div>
}
function AdPanel({ad,app,daily,onClose}:{ad:any;app:any;daily:any;onClose:()=>void}){
 const data:any[]=Object.values(daily||{}).sort((a:any,b:any)=>String(a.date)<String(b.date)?-1:1);
 useEffect(()=>{const f=(e:KeyboardEvent)=>{if(e.key==="Escape")onClose()};addEventListener("keydown",f);return()=>removeEventListener("keydown",f)},[]);
 return <><div className="scrim show z50" onClick={onClose}/><aside className="panel"><div className="panelHead"><div><span className="eyebrow">Ad unit · {app.name}</span><h3>{ad.name}</h3></div><button className="icon" onClick={onClose}><Icon t="close"/></button></div><div className="panelBody"><div className="pStats"><div><span>Initial</span><b>{money(ad.initial)}</b></div><div><span>Latest</span><b>{money(ad.latest)}</b></div><div><span>At risk</span><b className={ad.loss>0?"danger":""}>{money(ad.loss)}</b></div><div><span>Adjustment</span><b className={ad.loss>0?"danger":""}>{pct(ad.rate)}</b></div></div><div className="pRow"><span>Severity</span><Status value={ad.status}/></div><h4>Trend by revenue date</h4><div className="chart sm"><ResponsiveContainer width="100%" height="100%"><AreaChart data={data} margin={{top:8,right:8,left:-8,bottom:0}}><XAxis dataKey="date" tickFormatter={v=>String(v).slice(5)} tickLine={false} axisLine={false} tick={{fill:"var(--faint)",fontSize:11}} minTickGap={20}/><YAxis tickFormatter={v=>money(v)} tickLine={false} axisLine={false} tick={{fill:"var(--faint)",fontSize:11}} width={52}/><Tooltip content={<Tip/>}/>{days.map((x,i)=><Area key={x} type="monotone" dataKey={"d"+i} name={x} stroke={colors[i]} fill="none" strokeWidth={2} dot={false} animationDuration={900} connectNulls/>)}</AreaChart></ResponsiveContainer></div><h4>Daily snapshots</h4><div className="tableWrap"><table><thead><tr><th>Date</th>{days.map(x=><th key={x} className="num">{x}</th>)}</tr></thead><tbody>{[...data].reverse().map((r:any,i:number)=><tr key={i}><td className="muted">{r.date}</td>{days.map((_,j)=><td key={j} className="num">{r["d"+j]==null?"—":money(r["d"+j])}</td>)}</tr>)}</tbody></table></div></div></aside></>
}

function SnapshotTable({trend}:{trend:any[]}){
 const[page,setPage]=useState(1),[sort,setSort]=useState({k:"date",dir:-1}),[q,setQ]=useState("");
 const rows=trend.map((r:any)=>{const last=[r.d4,r.d3,r.d2,r.d1].find((x:any)=>x!=null);return{...r,loss:r.d0!=null&&last!=null?Math.max(0,r.d0-last):0,adj:r.d0!=null&&last!=null?(last-r.d0)/r.d0*100:null}}).filter((r:any)=>r.date.includes(q));
 const val=(r:any,k:string)=>k==="date"?r.date:k==="loss"?r.loss:k==="adj"?(r.adj??-Infinity):(r[k]??-1);
 const pageSize=8,maxLoss=Math.max(1,...rows.map((r:any)=>r.loss));
 const sorted=[...rows].sort((a,b)=>{const x=val(a,sort.k),y=val(b,sort.k);return(x>y?1:x<y?-1:0)*sort.dir});
 const pageCount=Math.max(1,Math.ceil(sorted.length/pageSize)),shown=sorted.slice((page-1)*pageSize,page*pageSize);
 const toggle=(k:string)=>{setSort(s=>s.k===k?{k,dir:-s.dir}:{k,dir:k==="date"?1:-1});setPage(1)};
 const cols:[string,string][]=[["date","Revenue date"],...days.map((x,i):[string,string]=>["d"+i,x]),["loss","At risk"],["adj","Adjustment %"]];
 return <div className="adBlock snapBlock"><div className="adHead"><div className="adTitle"><b>Snapshots</b><span className="countBadge">{rows.length} dates</span></div><SearchBox value={q} onChange={v=>{setQ(v);setPage(1)}} placeholder="Search revenue dates…"/></div>{rows.length?<><div className="tableWrap"><table><thead><tr>{cols.map(([k,l])=><th key={k} className={(/^d\d$/.test(k)||k==="loss"||k==="adj"?"num ":"")+"sortable"+(sort.k===k?" sorted":"")} onClick={()=>toggle(k)}>{l}<span className="sortIc">{sort.k===k?(sort.dir>0?"↑":"↓"):""}</span></th>)}</tr></thead><tbody>{shown.map((r:any,i:number)=><tr key={r.date} className="rowIn clickRow" style={{animationDelay:i*30+"ms"}}><td className="muted">{r.date}</td>{days.map((_,j)=><td key={j} className="num">{r["d"+j]==null?"—":precise(r["d"+j])}</td>)}<td className={"num heatCell"+(r.loss>0?" danger":"")}><i className="heat" style={{width:(r.loss/maxLoss*100)+"%"}}/><span>{r.loss>0?precise(r.loss):"—"}</span></td><td className={"num"+(r.adj!=null&&r.adj<0?" danger":"")}>{r.adj==null?"—":spct(r.adj)}</td></tr>)}</tbody></table></div>{pageCount>1&&<div className="pagination"><button className="pageBtn" disabled={page===1} onClick={()=>setPage(p=>p-1)}>Previous</button><span>Page {page} of {pageCount}</span><button className="pageBtn" disabled={page===pageCount} onClick={()=>setPage(p=>p+1)}>Next</button></div>}</>:<div className="empty">No snapshots in this period.</div>}</div>
}
