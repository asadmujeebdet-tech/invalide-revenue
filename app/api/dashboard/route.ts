import {NextRequest,NextResponse} from "next/server";
import {getPool} from "@/lib/db";

export const dynamic="force-dynamic";

const day=(s:string,n:number)=>{const d=new Date(s+"T00:00:00Z");d.setUTCDate(d.getUTCDate()+n);return d.toISOString().slice(0,10)};
const num=(v:any)=>Number(v||0);

export async function GET(req:NextRequest){
  try{
    const u=new URL(req.url);
    const end=u.searchParams.get("end")||new Date().toISOString().slice(0,10);
    const start=u.searchParams.get("start")||day(end,-29);
    const appId=u.searchParams.get("appId");
    const pool=getPool();
    const p=[start,end,appId];

    // The app workspace is always app-scoped. Fetch raw snapshots once and derive
    // D0-D4/retention/trend data in memory instead of running eight aggregations.
    if(!appId) {
      return NextResponse.json({
        range:{start,end},filters:{apps:[]},selectedApp:null,
        kpis:{initial:0,latest:0,risk:0,rate:null,affectedApps:0,affectedAdUnits:0},
        trend:[],retention:[],apps:[],adUnits:[],appDaily:{},appDayTotals:{},adDaily:{},attention:[]
      });
    }

    const appSnapshotSql=`SELECT s.app_id AS id,s.report_date::text AS date,
      s.snapshot_day::int AS day_index,s.snapshot_date::text AS snapshot_date,
      s.revenue_micros::float/1000000 AS revenue
      FROM app_revenue_snapshots s
      WHERE s.app_id::text=$3::text AND s.report_date BETWEEN $1::date AND $2::date
        AND s.snapshot_day BETWEEN 0 AND 4
      ORDER BY s.report_date,s.snapshot_day,s.snapshot_date DESC`;

    const adSnapshotSql=`SELECT s.ad_unit_id AS id,u.app_id,
      s.report_date::text AS date,s.snapshot_day::int AS day_index,
      s.snapshot_date::text AS snapshot_date,
      s.revenue_micros::float/1000000 AS revenue
      FROM ad_unit_revenue_snapshots s
      JOIN ad_units u ON u.ad_unit_id=s.ad_unit_id
      WHERE u.app_id::text=$3::text AND s.report_date BETWEEN $1::date AND $2::date
        AND s.snapshot_day BETWEEN 0 AND 4
      ORDER BY s.ad_unit_id,s.report_date,s.snapshot_day,s.snapshot_date DESC`;

    const [appMeta,adMeta,appSnapshots,adSnapshots]=await Promise.all([
      pool.query("SELECT app_id AS id,app_name AS name FROM apps ORDER BY app_name"),
      pool.query("SELECT u.ad_unit_id AS id,u.ad_unit_name AS name,u.app_id FROM ad_units u WHERE u.app_id::text=$1::text ORDER BY u.ad_unit_name",[appId]),
      pool.query(appSnapshotSql,p),
      pool.query(adSnapshotSql,p)
    ]);

    const selectedMeta=appMeta.rows.find((a:any)=>String(a.id)===String(appId));
    if(!selectedMeta) {
      return NextResponse.json({error:"App not found."},{status:404});
    }

    const seenApp=new Set<string>();let dupes=0,maxSnap="";
    const latestByDate=new Map<string,any>();
    const trendMap:any={};
    const appDaily:any={};
    const appDayTotals:any={};
    for(const r of appSnapshots.rows){
      // one observation per (revenue date, snapshot day): rows arrive newest-first, so the first one wins
      const dk=r.date+"|"+r.day_index;if(seenApp.has(dk)){dupes++;continue}seenApp.add(dk);
      if(String(r.snapshot_date)>maxSnap)maxSnap=String(r.snapshot_date);
      const key=String(r.date);
      const d=Number(r.day_index);
      trendMap[key]??={date:key};
      trendMap[key]["d"+d]=(trendMap[key]["d"+d]||0)+num(r.revenue);
      appDaily[String(r.id)]??={};
      appDaily[String(r.id)][key]??={date:key};
      appDaily[String(r.id)][key]["d"+d]=(appDaily[String(r.id)][key]["d"+d]||0)+num(r.revenue);
      appDayTotals[String(r.id)]??={};
      appDayTotals[String(r.id)]["d"+d]=(appDayTotals[String(r.id)]["d"+d]||0)+num(r.revenue);
      const prev=latestByDate.get(key);
      if(!prev || d>Number(prev.day_index) || (d===Number(prev.day_index) && String(r.snapshot_date)>String(prev.snapshot_date))) latestByDate.set(key,r);
    }

    // Per-date rows: add latest available value, settled flag and signed adjustment (Latest - Initial)
    const trendRows:any[]=(Object.values(trendMap) as any[]).sort((x:any,y:any)=>x.date<y.date?-1:1);
    for(const r of trendRows){const l=[r.d4,r.d3,r.d2,r.d1,r.d0].find((x:any)=>x!=null);r.latest=l??null;r.settled=r.d4!=null;
      r.adj=num(r.d0)>0&&l!=null?l-r.d0:null;r.adjPct=num(r.d0)>0&&l!=null?(l-r.d0)/r.d0*100:null}
    const eligible=trendRows.filter((r:any)=>num(r.d0)>0);          // zero-initial days = no ad activity, excluded
    const settledRows=eligible.filter((r:any)=>r.settled);
    const quality={dates:eligible.length,settled:settledRows.length,pending:eligible.length-settledRows.length,
      latestSettledDate:settledRows.length?settledRows[settledRows.length-1].date:null,
      lastReportDate:trendRows.length?trendRows[trendRows.length-1].date:null,latestSnapshotDate:maxSnap||null,duplicateRows:dupes};
    // Like-for-like retention: for each snapshot day only compare against D0 of the SAME revenue dates
    const retentionOut=Array.from({length:5},(_,i)=>{
      const rows=eligible.filter((r:any)=>r["d"+i]!=null);
      const revenue=rows.reduce((n:number,r:any)=>n+num(r["d"+i]),0),base=rows.reduce((n:number,r:any)=>n+num(r.d0),0);
      return {day:i,revenue,base,dates:rows.length,retention:base?revenue/base*100:null};
    });

    const initial=Number(appDayTotals[String(appId)]?.d0||0);
    const latest=Array.from(latestByDate.entries()).filter(([k]:any)=>num(trendMap[k]?.d0)>0).reduce((n:number,[,r]:any)=>n+num(r.revenue),0);
    const risk=Math.max(0,initial-latest);
    const rate=initial?risk/initial*100:null;
    const statusRate=rate ?? 0;
    const appOut={...selectedMeta,initial,latest,loss:risk,rate,status:statusRate>=10?"CRITICAL":statusRate>=5?"HIGH":statusRate>=2?"MEDIUM":"LOW"};

    const adDailyMap:any={};
    const adTotals:any={};
    const adLatestByDate:any={};
    const seenAd=new Set<string>();
    for(const r of adSnapshots.rows){
      const id=String(r.id),date=String(r.date),d=Number(r.day_index);
      const dk=id+"|"+date+"|"+d;if(seenAd.has(dk))continue;seenAd.add(dk);
      adDailyMap[id]??={}; adDailyMap[id][date]??={date};
      adDailyMap[id][date]["d"+d]=(adDailyMap[id][date]["d"+d]||0)+num(r.revenue);
      adTotals[id]??={};
      adTotals[id]["d"+d]=(adTotals[id]["d"+d]||0)+num(r.revenue);
      adLatestByDate[id]??={};
      const prev=adLatestByDate[id][date];
      if(!prev || d>Number(prev.day_index) || (d===Number(prev.day_index) && String(r.snapshot_date)>String(prev.snapshot_date))) adLatestByDate[id][date]=r;
    }

    const adOut=adMeta.rows.map((a:any)=>{
      const t=adTotals[String(a.id)]||{};
      const initial=num(t.d0);
      const latest=Object.entries(adLatestByDate[String(a.id)]||{}).filter(([dt]:any)=>num(adDailyMap[String(a.id)]?.[dt]?.d0)>0).reduce((n:number,[,r]:any)=>n+num(r.revenue),0);
      const loss=Math.max(0,initial-latest),rate=initial?loss/initial*100:0;
      return {...a,initial,latest,loss,rate,status:rate>=10?"CRITICAL":rate>=5?"HIGH":rate>=2?"MEDIUM":"LOW"};
    }).filter((x:any)=>x.initial>0).sort((a:any,b:any)=>b.loss-a.loss);

    const attention=[
      {...appOut,type:"App"},
      ...adOut.slice(0,6).map((x:any)=>({...x,type:"Ad Unit"}))
    ].sort((a:any,b:any)=>b.loss-a.loss).slice(0,6);

    return NextResponse.json({
      range:{start,end},
      filters:{apps:appMeta.rows},selectedApp:appId,
      kpis:{initial,latest,risk,rate,adjustment:latest-initial,adjustmentPct:initial?(latest-initial)/initial*100:null,settled:quality.settled,pending:quality.pending,dates:quality.dates,
        affectedApps:appOut.loss>0?1:0,
        affectedAdUnits:adOut.filter((x:any)=>x.loss>0).length},
      trend:trendRows,
      quality,
      retention:retentionOut,
      apps:[appOut],
      adUnits:adOut,
      appDaily:appDaily,
      appDayTotals,
      adDaily:adDailyMap,
      attention
    });
  }catch(e:any){
    console.error(e);
    return NextResponse.json({error:"Unable to load revenue analytics."},{status:500});
  }
}