"use client";
import {useEffect,useRef,useState} from "react";
import {appIconUrl} from "@/lib/appIcons";
export const isoLocal=(d:Date)=>d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0");
/** Animated number: eases from the previous value to the new one. */
export function CountUp({n,f,ms=900}:{n:number;f:(n:number)=>string;ms?:number}){
  const[v,setV]=useState(0);const from=useRef(0);
  useEffect(()=>{const to=Number(n)||0,a=from.current,t0=performance.now();
    if(matchMedia("(prefers-reduced-motion:reduce)").matches){setV(to);from.current=to;return}
    let r=0;const tick=(t:number)=>{const p=Math.min(1,(t-t0)/ms),e=1-Math.pow(1-p,4);const x=a+(to-a)*e;setV(x);from.current=x;if(p<1)r=requestAnimationFrame(tick);else from.current=to};
    r=requestAnimationFrame(tick);return()=>cancelAnimationFrame(r)},[n]);
  return <>{f(v)}</>}
/** Animated connector: energy pipe with sweeping glow, travelling sparks, pulsing arrow node and a delta chip. */
export function FlowArrow({delta,i=0}:{delta:number|null;i?:number}){
  const down=delta!=null&&delta<0;
  return <div className={"journeyArrow flow"+(down?" down":"")} style={{"--i":i} as any}>
    {delta!=null&&<em>{(delta>0?"+":"")+delta.toFixed(1)+"%"}</em>}
    <div className="pipe"><span className="pipeFill"/><span className="spark s1"/><span className="spark s2"/><span className="spark s3"/>
      <span className="node"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M9 5l7 7-7 7"/></svg></span></div></div>}
/** Brand glyph: rising bars + amber "at risk" dot. */
export function LogoMark({size=22}:{size?:number}){return <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden><g fill="#fff"><rect x="9" y="37" width="12" height="18" rx="3.5" opacity=".55"/><rect x="26" y="26" width="12" height="29" rx="3.5" opacity=".8"/><rect x="43" y="14" width="12" height="41" rx="3.5"/></g><circle cx="49" cy="9" r="6.5" fill="#ffb020"/></svg>}
/** Full-area loader shown while switching apps / loading data. */
export function AppLoader({name,title,full=false}:{name?:string;title:string;full?:boolean}){
  const msgs=["Fetching revenue snapshots","Reconciling D0 → D4","Calculating revenue at risk","Rendering your workspace"];
  const[m,setM]=useState(0);const[bad,setBad]=useState(false);const src=name?appIconUrl(name,160):null;
  useEffect(()=>{const t=setInterval(()=>setM(x=>(x+1)%msgs.length),1100);return()=>clearInterval(t)},[]);
  return <div className={"switchLoader"+(full?" full":"")} role="status" aria-live="polite">
    <div className="orbit"><i className="ring r1"/><i className="ring r2"/><i className="ring r3"/><span className="dotO d1"/><span className="dotO d2"/><span className="dotO d3"/>
      <div className="coreIcon">{src&&!bad?<img src={src} alt="" referrerPolicy="no-referrer" onError={()=>setBad(true)}/>:<span className="coreFb"><LogoMark size={44}/></span>}</div></div>
    <b className="slName">{title}</b><span className="slMsg" key={m}>{msgs[m]}…</span>
    <div className="slSteps">{["D0","D1","D2","D3","D4"].map((x,k)=><span key={x} style={{"--k":k} as any}>{x}</span>)}</div>
    <div className="slBar"><i/></div></div>}
/** Tiny toast for feedback such as "Exported 42 rows". */
export function useToast(){
  const[m,setM]=useState("");const t=useRef<any>(null);
  const show=(x:string)=>{setM(x);clearTimeout(t.current);t.current=setTimeout(()=>setM(""),2600)};
  return{show,node:m?<div className="toast" role="status"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12l5 5 9-10"/></svg>{m}</div>:null}}

const D5=["D0","D1","D2","D3","D4"];
const usd=(n:number)=>new Intl.NumberFormat("en-US",{style:"currency",currency:"USD",notation:"compact",maximumFractionDigits:1}).format(n||0);
/** Chevron pipeline. Pass per-date `rows` (preferred): values and kept-% are computed like-for-like on the same revenue dates. */
export function ChevronFlow({rows,totals,compact=false,note=false}:{rows?:any[];totals?:any;compact?:boolean;note?:boolean}){
  const base=rows?rows.filter(r=>Number(r.d0||0)>0):null;
  const sum=(rs:any[],k:string)=>rs.reduce((n,r)=>n+Number(r[k]||0),0);
  const val=(i:number)=>base?(()=>{const rs=base.filter(r=>r["d"+i]!=null);return rs.length?sum(rs,"d"+i):null})():(totals?.["d"+i]??null);
  const rate=(i:number)=>{const rs=base?base.filter(r=>r["d"+i]!=null&&r["d"+(i+1)]!=null):null;if(rs){const a=sum(rs,"d"+i);return a?sum(rs,"d"+(i+1))/a*100:null}const a=val(i),n=val(i+1);return a&&n!=null?n/a*100:null};
  const first=val(0);
  const items:any[]=[<div key="d0" className="chev val c0" style={{"--k":0} as any}><b>{first==null?"—":usd(first)}</b><span>D0 · Initial</span></div>];
  for(let i=1;i<=4;i++){
    const v=val(i),r=rate(i-1);
    items.push(<div key={"r"+i} className="chev rate" style={{"--k":items.length} as any}><b className={r!=null&&r<100?"dn":r!=null?"up":""}>{r==null?"—":r.toFixed(1)+"%"}</b><span>D{i-1} → D{i}</span></div>);
    items.push(<div key={"d"+i} className={"chev val c"+i+(v==null?" pend":"")} style={{"--k":items.length} as any}><b>{v==null?"—":usd(v)}</b><span>D{i}{v==null?" · Upcoming":""}</span></div>);
  }
  return <div className={"chevWrap"+(compact?" compact":"")}><div className={"chevStrip"+(compact?" compact":"")}>{items}</div></div>;
}