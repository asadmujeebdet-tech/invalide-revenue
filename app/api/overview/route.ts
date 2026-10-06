import {NextRequest,NextResponse} from "next/server";
import {getPool} from "@/lib/db";

export const dynamic="force-dynamic";

export async function GET(req:NextRequest){
  try{
    const u=new URL(req.url);
    const end=u.searchParams.get("end")||new Date().toISOString().slice(0,10);
    const start=u.searchParams.get("start")||(() => {const d=new Date(end+"T00:00:00Z");d.setUTCDate(d.getUTCDate()-6);return d.toISOString().slice(0,10)})();
    const pool=getPool();
    const [apps,snapshots]=await Promise.all([
      pool.query("SELECT app_id AS id,app_name AS name FROM apps ORDER BY app_name"),
      pool.query(`SELECT s.app_id AS id,s.report_date::text AS date,s.snapshot_day::int AS day_index,
        s.snapshot_date::text AS snapshot_date,s.revenue_micros::float/1000000 AS revenue
        FROM app_revenue_snapshots s
        WHERE s.report_date BETWEEN $1::date AND $2::date AND s.snapshot_day BETWEEN 0 AND 4
        ORDER BY s.app_id,s.report_date,s.snapshot_day,s.snapshot_date DESC`,[start,end])
    ]);
    const byApp:any={};
    for(const a of apps.rows) byApp[String(a.id)]={...a,initial:0,latest:0,loss:0,rate:null,trendMap:{},dayTotals:{},latestByDate:{}};
    for(const r of snapshots.rows){
      const id=String(r.id), d=Number(r.day_index), date=String(r.date);
      if(!byApp[id]) continue;
      const a=byApp[id];
      a.trendMap[date]??={date};
      a.trendMap[date]["d"+d]=(a.trendMap[date]["d"+d]||0)+Number(r.revenue||0);
      a.dayTotals["d"+d]=(a.dayTotals["d"+d]||0)+Number(r.revenue||0);
      const prev=a.latestByDate[date];
      if(!prev||d>Number(prev.day_index)||(d===Number(prev.day_index)&&String(r.snapshot_date)>String(prev.snapshot_date))) a.latestByDate[date]=r;
    }
    const out=Object.values(byApp).map((a:any)=>{
      a.initial=Number(a.dayTotals.d0||0);
      a.latest=Object.values(a.latestByDate).reduce((n:number,r:any)=>n+Number(r.revenue||0),0);
      a.loss=Math.max(0,a.initial-a.latest);
      a.rate=a.initial?a.loss/a.initial*100:null;
      a.status=a.rate>=10?"CRITICAL":a.rate>=5?"HIGH":a.rate>=2?"MEDIUM":"LOW";
      a.retention=Array.from({length:5},(_,i)=>({day:i,revenue:Number(a.dayTotals["d"+i]||0),retention:a.initial?Number(a.dayTotals["d"+i]||0)/a.initial*100:null}));
      a.trend=Object.values(a.trendMap);
      delete a.trendMap; delete a.latestByDate;
      return a;
    });
    const totalInitial=out.reduce((n:any,a:any)=>n+a.initial,0);
    const totalLatest=out.reduce((n:any,a:any)=>n+a.latest,0);
    const totalRisk=Math.max(0,totalInitial-totalLatest);
    return NextResponse.json({
      range:{start,end},filters:{apps:apps.rows},
      kpis:{initial:totalInitial,latest:totalLatest,risk:totalRisk,rate:totalInitial?totalRisk/totalInitial*100:null,
        affectedApps:out.filter((a:any)=>a.loss>0).length,apps:out.length},
      apps:out
    });
  }catch(e:any){
    console.error(e);
    return NextResponse.json({error:"Unable to load revenue overview."},{status:500});
  }
}