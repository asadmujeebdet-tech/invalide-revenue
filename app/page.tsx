"use client";
import {useEffect,useMemo,useState} from "react";
import {ResponsiveContainer,LineChart,Line,XAxis,YAxis,Tooltip,CartesianGrid,Legend} from "recharts";

const money=(n:number)=>new Intl.NumberFormat("en-US",{style:"currency",currency:"USD",notation:"compact",maximumFractionDigits:1}).format(n||0);
const pct=(n:any)=>n==null?"—":Number(n).toFixed(1)+"%";
const dayLabels=["D0","D1","D2","D3","D4"];

function KPI({label,value,meta,danger=false}:{label:string;value:string;meta:string;danger?:boolean}){
  return <div className="kpi"><span>{label}</span><b className={danger?"danger":""}>{value}</b><small>{meta}</small></div>
}
function SectionTitle({eyebrow,title,sub}:{eyebrow:string;title:string;sub:string}){
  return <div className="sectionTitle"><small>{eyebrow}</small><h2>{title}</h2><p>{sub}</p></div>
}
function Status({value}:{value:string}){return <span className={"badge "+value.toLowerCase()}>{value}</span>}

export default function Dashboard(){
  const[d,setD]=useState<any>();const[err,setErr]=useState("");
  const[start,setStart]=useState("");const[end,setEnd]=useState("");
  const[loading,setLoading]=useState(false);const[selectedApp,setSelectedApp]=useState<string|null>(null);

  const load=async()=>{
    try{
      setLoading(true);setErr("");
      const now=new Date();
      const e=end||now.toISOString().slice(0,10);
      const s=start||new Date(now.getTime()-29*86400000).toISOString().slice(0,10);
      const q=new URLSearchParams({start:s,end:e});
      const r=await fetch("/api/dashboard?"+q);
      const j=await r.json();
      if(!r.ok)throw Error(j.error);
      setD(j);setStart(s);setEnd(e);
    }catch(e:any){setErr(e.message||"Unable to load dashboard")}
    finally{setLoading(false)}
  };

  useEffect(()=>{load()},[]);
  const trend=useMemo(()=>d?.trend||[],[d]);
  if(err&&!d)return <div className="error"><b>Unable to load workspace</b><span>{err}</span><button onClick={load}>Retry</button></div>;
  if(!d)return <div className="error"><b>Loading Revenue Intelligence</b><span>Connecting to your database…</span></div>;
  const k=d.kpis;

  const scrollToApp=(id:string)=>{
    setSelectedApp(id);
    document.getElementById("app-"+id)?.scrollIntoView({behavior:"smooth",block:"start"});
  };

  return <div className="app">
    <aside className="sidebar">
      <div className="brand"><div>IR</div><section><b>Invalid Revenue</b><small>REVENUE INTELLIGENCE</small></section></div>
      <div className="sideHeading">YOUR APPS</div>
      <nav>{d.apps.map((a:any)=><button key={a.id} className={selectedApp===String(a.id)?"active":""} onClick={()=>scrollToApp(String(a.id))}>
        <span className="appDot"/><span className="appName">{a.name}</span><span className="appLoss">{money(a.loss)}</span>
      </button>)}</nav>
      <div className="sideFoot"><span className="liveDot"/> Live revenue workspace</div>
    </aside>

    <main>
      <header>
        <div className="crumb"><b>Revenue Intelligence</b><span>·</span>{d.apps.length} apps</div>
        <button className="refresh" onClick={load}>{loading?"Refreshing…":"↻ Refresh Data"}</button>
      </header>

      <div className="page">
        <div className="head">
          <div><small>PORTFOLIO OVERVIEW</small><h1>Revenue at a glance</h1>
          <p>See the complete revenue journey for every app, from D0 through D4, without switching filters.</p></div>
        </div>

        <div className="filters">
          <div className="filterTitle"><small>REVENUE DATE</small><b>Choose the revenue reporting period</b></div>
          <label>From<input type="date" value={start} onChange={e=>setStart(e.target.value)}/></label>
          <label>To<input type="date" value={end} onChange={e=>setEnd(e.target.value)}/></label>
          <button onClick={load}>Apply</button>
        </div>

        <div className="kpis">
          <KPI label="Initial Revenue" value={money(k.initial)} meta="D0 across selected revenue dates"/>
          <KPI label="Latest Revenue" value={money(k.latest)} meta="Latest available D0–D4 snapshot"/>
          <KPI label="Revenue at Risk" value={money(k.risk)} meta="Initial minus latest" danger/>
          <KPI label="Adjustment Rate" value={pct(k.rate)} meta="Risk as % of initial" danger/>
          <KPI label="Apps with Risk" value={String(k.affectedApps)} meta={"of "+d.apps.length+" apps"}/>
          <KPI label="Ad Units with Risk" value={String(k.affectedAdUnits)} meta="Across all apps"/>
        </div>

        <section className="panel trendPanel">
          <SectionTitle eyebrow="PORTFOLIO TREND" title="Revenue journey by reporting date" sub="Each line is a snapshot day. The horizontal axis is the revenue date — not the snapshot date."/>
          <div className="chart trendChart"><ResponsiveContainer width="100%" height="100%">
            <LineChart data={trend} margin={{top:8,right:18,left:4,bottom:4}}>
              <CartesianGrid strokeDasharray="3 3"/>
              <XAxis dataKey="date" tick={{fontSize:10}} tickFormatter={(v)=>String(v).slice(5)}/>
              <YAxis tick={{fontSize:10}} tickFormatter={(v)=>money(Number(v))}/>
              <Tooltip labelFormatter={(v)=>"Revenue date: "+v} formatter={(v:any,n:any)=>[money(Number(v)),n.toUpperCase()]}/>
              <Legend wrapperStyle={{fontSize:10}}/>
              <Line type="monotone" dataKey="d0" name="D0" stroke="var(--lineD0)" strokeWidth={2.5} dot={false} connectNulls/>
              <Line type="monotone" dataKey="d1" name="D1" stroke="var(--lineD1)" strokeWidth={2.5} dot={false} connectNulls/>
              <Line type="monotone" dataKey="d2" name="D2" stroke="var(--lineD2)" strokeWidth={2.5} dot={false} connectNulls/>
              <Line type="monotone" dataKey="d3" name="D3" stroke="var(--lineD3)" strokeWidth={2.5} dot={false} connectNulls/>
              <Line type="monotone" dataKey="d4" name="D4" stroke="var(--lineD4)" strokeWidth={2.5} dot={false} connectNulls/>
            </LineChart>
          </ResponsiveContainer></div>
        </section>

        <div className="appsHeader"><div><small>APP-BY-APP INTELLIGENCE</small><h2>Complete revenue picture</h2><p>Every app includes D0–D4 movement and its ad units.</p></div><span>{d.apps.length} apps</span></div>

        <div className="appList">
          {d.apps.map((app:any)=>(
            <AppCard key={app.id} app={app} adUnits={d.adUnits.filter((x:any)=>String(x.app_id)===String(app.id))} daily={d.appDaily[String(app.id)]||{}} id={"app-"+app.id}/>
          ))}
        </div>
      </div>
    </main>
  </div>
}

function AppCard({app,adUnits,daily,id}:{app:any;adUnits:any[];daily:any;id:string}){
  const dates=Object.keys(daily).sort();
  const latestDate=dates[dates.length-1];
  const latest=latestDate?daily[latestDate]:null;
  const days=dayLabels.map((label,i)=>({label,value:latest?.["d"+i]??null}));
  return <section className="appCard" id={id}>
    <div className="appCardTop">
      <div className="appIdentity"><div className="appIcon">{app.name.slice(0,1).toUpperCase()}</div><div><small>APPLICATION</small><h3>{app.name}</h3><span>{dates.length} revenue dates in selected period</span></div></div>
      <div className="appHeadline"><span>Revenue at risk</span><b>{money(app.loss)}</b><Status value={app.status}/></div>
    </div>

    <div className="journey">
      {days.map((x,i)=><div className={"journeyStep "+(i>0?"hasArrow":"")} key={x.label}>
        {i>0&&<div className="flowArrow"><span>→</span></div>}
        <div className="journeyLabel">{x.label}</div>
        <strong>{x.value==null?"—":money(x.value)}</strong>
        {i<4&&x.value!=null&&days[i+1].value!=null?<small>{days[i+1].value<=x.value?"retained":"up"} · {x.value?Math.abs((days[i+1].value-x.value)/x.value*100).toFixed(0):0}%</small>:<small>{i===0?"baseline":"available"}</small>}
      </div>)}
    </div>

    <div className="appCardBottom">
      <div className="appMetric"><span>Initial</span><b>{money(app.initial)}</b></div>
      <div className="appMetric"><span>Latest</span><b>{money(app.latest)}</b></div>
      <div className="appMetric"><span>Adjustment</span><b className={app.loss>0?"danger":""}>{pct(app.rate)}</b></div>
      <div className="adBlock"><div className="adBlockHead"><b>Ad units</b><span>{adUnits.length}</span></div>
        {adUnits.length?<div className="adList">{adUnits.map((ad:any)=><div className="adRow" key={ad.id}><div><b>{ad.name}</b><small>{money(ad.latest)} latest · {money(ad.loss)} at risk</small></div><Status value={ad.status}/></div>)}</div>:<div className="empty">No ad-unit revenue in this period.</div>}
      </div>
    </div>
  </section>
}