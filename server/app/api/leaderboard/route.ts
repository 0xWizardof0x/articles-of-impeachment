import { env } from 'cloudflare:workers';
import { COUNTRIES, validateResult, json, playerCookie } from '../../../lib/leaderboard-core.mjs';
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
 try {
  if (!env.DB) return json({error:'unavailable'},503);
  const params=new URL(request.url).searchParams;
  const mode=params.get('mode') || 'hard';
  const country=params.get('country') || '';
  if (!['easy','hard','harder'].includes(mode) || (country && !COUNTRIES.has(country))) return json({error:'invalid'},400);
  // Best completed run per browser identity, then scope to a country. No private IDs leave the server.
  const result=await env.DB.prepare(`WITH best AS (
   SELECT name,country,mode,score,won,days_remaining,created_at,
   ROW_NUMBER() OVER (PARTITION BY player_id ORDER BY score DESC,created_at ASC,run_id ASC) AS best_rank
   FROM scores WHERE mode=?
  ) SELECT name,country,score,won,days_remaining AS daysRemaining FROM best
  WHERE best_rank=1 AND (?='' OR country=?) ORDER BY score DESC,created_at ASC,name ASC LIMIT 100`).bind(mode,country,country).all();
  return json({entries:result.results,mode,country});
 } catch { return json({error:'unavailable'},503); }
}
export async function POST(request: Request) {
 try {
  if (!env.DB) return json({error:'unavailable'},503);
  if (request.headers.get('origin') !== new URL(request.url).origin || !request.headers.get('content-type')?.startsWith('application/json')) return json({error:'forbidden'},403);
  if (Number(request.headers.get('content-length'))>4096) return json({error:'invalid'},413);
  const raw=await request.text();
  if(raw.length>4096) return json({error:'invalid'},413);
  let result;
  try { result=validateResult(JSON.parse(raw)); } catch(error) { return json({error:(error as Error).message},400); }
  const player=playerCookie(request) || crypto.randomUUID();
  const headers={'Set-Cookie':`aoi_player=${player}; Path=/; HttpOnly; SameSite=Lax; Max-Age=31536000${new URL(request.url).protocol==='https:'?'; Secure':''}`};
  const existing=await env.DB.prepare('SELECT player_id,score FROM scores WHERE run_id=?').bind(result.runId).first<{player_id:string,score:number}>();
  if(existing) return existing.player_id===player ? json({score:existing.score},200,headers) : json({error:'invalid'},409);
  const now=Date.now();
  const recent=await env.DB.prepare('SELECT COUNT(*) AS total FROM scores WHERE player_id=? AND created_at>?').bind(player,now-3600000).first<{total:number}>();
  if((recent?.total || 0)>=20) return json({error:'rate'},429,headers);
  await env.DB.prepare('INSERT INTO scores (run_id,player_id,name,country,mode,score,won,days_remaining,created_at) VALUES (?,?,?,?,?,?,?,?,?)')
   .bind(result.runId,player,result.name,result.country,result.mode,result.score,Number(result.won),result.daysRemaining,now).run();
  return json({score:result.score},201,headers);
 } catch { return json({error:'unavailable'},503); }
}
