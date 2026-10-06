import {redirect} from "next/navigation";
import {getPool} from "@/lib/db";
export const dynamic="force-dynamic";
export default async function AppsIndex(){
 const pool=getPool();
 const r=await pool.query("SELECT app_id FROM apps ORDER BY app_name LIMIT 1");
 if(!r.rows[0]) return <main style={{padding:40}}>No apps are configured.</main>;
 redirect("/apps/"+r.rows[0].app_id);
}
