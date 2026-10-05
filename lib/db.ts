import { Pool } from "pg";
declare global { var invalidRevenuePool: Pool | undefined; }
export function getPool(){
 if(!process.env.DATABASE_URL) throw new Error("DATABASE_URL is not configured.");
 if(!global.invalidRevenuePool) global.invalidRevenuePool=new Pool({connectionString:process.env.DATABASE_URL,max:10,idleTimeoutMillis:30000,connectionTimeoutMillis:10000,ssl:process.env.DATABASE_URL.includes("sslmode=require")?{rejectUnauthorized:false}:undefined});
 return global.invalidRevenuePool;
}