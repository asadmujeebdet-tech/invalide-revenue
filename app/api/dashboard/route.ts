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

    const apps=await pool.query("SELECT app_id AS id,app_name AS name FROM apps ORDER BY app_name");
    const ads=await pool.query("SELECT u.ad_unit_id AS id,u.ad_unit_name AS name,u.app_id FROM ad_units u JOIN apps a ON a.app_id=u.app_id WHERE ($3::text IS NULL OR u.app_id::text=$3) ORDER BY u.app_id,u.ad_unit_name");

    const initialSql=`SELECT s.app_id AS id,SUM(s.revenue_micros)::float/1000000 initial
      FROM app_revenue_snapshots s
      JOIN apps a ON a.app_id=s.app_id
      WHERE s.report_date BETWEEN $1 AND $2 AND s.snapshot_day=0 AND ($3::text IS NULL OR s.app_id::text=$3)
      GROUP BY s.app_id`;

    const latestSql=`SELECT x.app_id AS id,SUM(x.revenue_micros)::float/1000000 latest
      FROM (
        SELECT DISTINCT ON (s.app_id,s.report_date)
          s.app_id,s.report_date,s.revenue_micros
        FROM app_revenue_snapshots s
        JOIN apps a ON a.app_id=s.app_id
        WHERE s.report_date BETWEEN $1 AND $2 AND ($3::text IS NULL OR s.app_id::text=$3)
        ORDER BY s.app_id,s.report_date,s.snapshot_day DESC,s.snapshot_date DESC
      ) x
      GROUP BY x.app_id`;

    const trendSql=`SELECT s.report_date::text AS date,s.snapshot_day::int AS day_index,
      SUM(s.revenue_micros)::float/1000000 AS revenue
      FROM app_revenue_snapshots s
      JOIN apps a ON a.app_id=s.app_id
      WHERE s.report_date BETWEEN $1 AND $2 AND ($3::text IS NULL OR s.app_id::text=$3)
      GROUP BY s.report_date,s.snapshot_day
      ORDER BY s.report_date,s.snapshot_day`;

    const appDailySql=`SELECT s.app_id AS app_id,s.report_date::text AS date,
      s.snapshot_day::int AS day_index,SUM(s.revenue_micros)::float/1000000 AS revenue
      FROM app_revenue_snapshots s
      JOIN apps a ON a.app_id=s.app_id
      WHERE s.report_date BETWEEN $1 AND $2 AND s.snapshot_day BETWEEN 0 AND 4 AND ($3::text IS NULL OR s.app_id::text=$3)
      GROUP BY s.app_id,s.report_date,s.snapshot_day
      ORDER BY s.app_id,s.report_date,s.snapshot_day`;

    const retentionSql=`SELECT s.snapshot_day::int AS day_index,
      SUM(s.revenue_micros)::float/1000000 AS revenue
      FROM app_revenue_snapshots s
      JOIN apps a ON a.app_id=s.app_id
      WHERE s.report_date BETWEEN $1 AND $2 AND s.snapshot_day BETWEEN 0 AND 4 AND ($3::text IS NULL OR s.app_id::text=$3)
      GROUP BY s.snapshot_day
      ORDER BY s.snapshot_day`;

    const adInitialSql=`SELECT s.ad_unit_id AS id,SUM(s.revenue_micros)::float/1000000 initial
      FROM ad_unit_revenue_snapshots s
      JOIN ad_units u ON u.ad_unit_id=s.ad_unit_id
      WHERE s.report_date BETWEEN $1 AND $2 AND s.snapshot_day=0 AND ($3::text IS NULL OR u.app_id::text=$3)
      GROUP BY s.ad_unit_id`;

    const adLatestSql=`SELECT x.ad_unit_id AS id,SUM(x.revenue_micros)::float/1000000 latest
      FROM (
        SELECT DISTINCT ON (s.ad_unit_id,s.report_date)
          s.ad_unit_id,s.report_date,s.revenue_micros
        FROM ad_unit_revenue_snapshots s
        JOIN ad_units u ON u.ad_unit_id=s.ad_unit_id
        WHERE s.report_date BETWEEN $1 AND $2 AND ($3::text IS NULL OR s.app_id::text=$3)
        ORDER BY s.ad_unit_id,s.report_date,s.snapshot_day DESC,s.snapshot_date DESC
      ) x
      GROUP BY x.ad_unit_id`;

    const adDailySql=`SELECT s.ad_unit_id AS ad_unit_id,s.report_date::text AS date,s.snapshot_day::int AS day_index,SUM(s.revenue_micros)::float/1000000 AS revenue FROM ad_unit_revenue_snapshots s JOIN ad_units u ON u.ad_unit_id=s.ad_unit_id WHERE s.report_date BETWEEN $1 AND $2 AND s.snapshot_day BETWEEN 0 AND 4 AND ($3::text IS NULL OR u.app_id::text=$3) GROUP BY s.ad_unit_id,s.report_date,s.snapshot_day ORDER BY s.ad_unit_id,s.report_date,s.snapshot_day`;
    const [ai,al,trend,retention,appDaily,adDaily,adi,adl]=await Promise.all([
      pool.query(initialSql,p),pool.query(latestSql,p),pool.query(trendSql,p),
      pool.query(retentionSql,p),pool.query(appDailySql,p),pool.query(adDailySql,p),
      pool.query(adInitialSql,p),pool.query(adLatestSql,p)
    ]);

    const iMap=new Map(ai.rows.map((r:any)=>[String(r.id),num(r.initial)]));
    const lMap=new Map(al.rows.map((r:any)=>[String(r.id),num(r.latest)]));
    const appsOut=apps.rows.map((a:any)=>{
      const initial=iMap.get(String(a.id))||0,latest=lMap.get(String(a.id))||0;
      const loss=Math.max(0,initial-latest),rate=initial?loss/initial*100:0;
      return {...a,initial,latest,loss,rate,status:rate>=10?"CRITICAL":rate>=5?"HIGH":rate>=2?"MEDIUM":"LOW"};
    }).filter((x:any)=>x.initial>0 && (!appId || String(x.id)===String(appId))).sort((a:any,b:any)=>b.loss-a.loss);

    const adiMap=new Map(adi.rows.map((r:any)=>[String(r.id),num(r.initial)]));
    const adlMap=new Map(adl.rows.map((r:any)=>[String(r.id),num(r.latest)]));
    const adOut=ads.rows.map((a:any)=>{
      const initial=adiMap.get(String(a.id))||0,latest=adlMap.get(String(a.id))||0;
      const loss=Math.max(0,initial-latest),rate=initial?loss/initial*100:0;
      return {...a,initial,latest,loss,rate,status:rate>=10?"CRITICAL":rate>=5?"HIGH":rate>=2?"MEDIUM":"LOW"};
    }).filter((x:any)=>x.initial>0).sort((a:any,b:any)=>b.loss-a.loss);

    const initial=appsOut.reduce((n:number,x:any)=>n+x.initial,0);
    const latest=appsOut.reduce((n:number,x:any)=>n+x.latest,0);
    const risk=Math.max(0,initial-latest);
    const rate=initial?risk/initial*100:null;

    const trendMap:any={};
    for(const r of trend.rows){
      trendMap[r.date]??={date:r.date};
      trendMap[r.date]["d"+r.day_index]=num(r.revenue);
    }

    const dailyMap:any={}; const appDayTotals:any={};
    for(const r of appDaily.rows){
      dailyMap[String(r.app_id)]??={};
      dailyMap[String(r.app_id)][r.date]??={date:r.date};
      dailyMap[String(r.app_id)][r.date]["d"+r.day_index]=num(r.revenue); appDayTotals[String(r.app_id)]??={}; appDayTotals[String(r.app_id)]["d"+r.day_index]=(appDayTotals[String(r.app_id)]["d"+r.day_index]||0)+num(r.revenue);
    }
    const adDailyMap:any={}; for(const r of adDaily.rows){adDailyMap[String(r.ad_unit_id)]??={};adDailyMap[String(r.ad_unit_id)][r.date]??={date:r.date};adDailyMap[String(r.ad_unit_id)][r.date]["d"+r.day_index]=num(r.revenue);}

    const d0=num(retention.rows.find((r:any)=>r.day_index===0)?.revenue);
    const retentionOut=retention.rows.map((r:any)=>({
      day:Number(r.day_index),revenue:num(r.revenue),retention:d0?num(r.revenue)/d0*100:null
    }));

    const critical=[...appsOut.slice(0,6).map((x:any)=>({...x,type:"App"})),
      ...adOut.slice(0,6).map((x:any)=>({...x,type:"Ad Unit"}))]
      .sort((a:any,b:any)=>b.loss-a.loss).slice(0,6);

    return NextResponse.json({
      range:{start,end},
      filters:{apps:apps.rows},selectedApp:appId,
      kpis:{initial,latest,risk,rate,
        affectedApps:appsOut.filter((x:any)=>x.loss>0).length,
        affectedAdUnits:adOut.filter((x:any)=>x.loss>0).length},
      trend:Object.values(trendMap),
      retention:retentionOut,
      apps:appsOut,
      adUnits:adOut,
      appDaily:dailyMap,
      appDayTotals,
      adDaily:adDailyMap,
      attention:critical
    });
  }catch(e:any){
    console.error(e);
    return NextResponse.json({error:"Unable to load revenue analytics."},{status:500});
  }
}