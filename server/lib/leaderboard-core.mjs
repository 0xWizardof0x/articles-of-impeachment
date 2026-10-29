export const COUNTRIES = new Set("AD AE AF AG AI AL AM AO AQ AR AS AT AU AW AX AZ BA BB BD BE BF BG BH BI BJ BL BM BN BO BQ BR BS BT BV BW BY BZ CA CC CD CF CG CH CI CK CL CM CN CO CR CU CV CW CX CY CZ DE DJ DK DM DO DZ EC EE EG EH ER ES ET FI FJ FK FM FO FR GA GB GD GE GF GG GH GI GL GM GN GP GQ GR GS GT GU GW GY HK HM HN HR HT HU ID IE IL IM IN IO IQ IR IS IT JE JM JO JP KE KG KH KI KM KN KP KR KW KY KZ LA LB LC LI LK LR LS LT LU LV LY MA MC MD ME MF MG MH MK ML MM MN MO MP MQ MR MS MT MU MV MW MX MY MZ NA NC NE NF NG NI NL NO NP NR NU NZ OM PA PE PF PG PH PK PL PM PN PR PS PT PW PY QA RE RO RS RU RW SA SB SC SD SE SG SH SI SJ SK SL SM SN SO SR SS ST SV SX SY SZ TC TD TF TG TH TJ TK TL TM TN TO TR TT TV TW TZ UA UG UM US UY UZ VA VC VE VG VI VN VU WF WS YE YT ZA ZM ZW".split(' '));
export function validateResult(body) {
  if (!body || typeof body !== 'object' || !['hard','harder'].includes(body.mode)) throw new Error('invalid');
  const name = typeof body.name === 'string' ? body.name.normalize('NFKC').trim().replace(/\s+/gu, ' ') : '';
  if ([...name].length < 2 || [...name].length > 24 || !/^[\p{L}\p{M}\p{N} ._'’\-]+$/u.test(name)) throw new Error('name');
  if (!COUNTRIES.has(body.country)) throw new Error('country');
  if (typeof body.won !== 'boolean' || !/^[a-f0-9-]{36}$/.test(body.runId || '')) throw new Error('invalid');
  const limits = {evidence:100, house:435, senate:100, support:100, capital:120, daysRemaining:body.mode === 'hard' ? 240 : 480};
  for (const [key,max] of Object.entries(limits)) if (!Number.isInteger(body[key]) || body[key]<0 || body[key]>max) throw new Error('invalid');
  if (body.won !== (body.senate >= 67) || (body.senate > 0 && body.house < 218)) throw new Error('invalid');
  // Victory dominates every unfinished result. Progress, public support, capital,
  // and (for wins only) saved session days break out the rest of the score.
  const score = (body.won ? 10000 : 0) + Math.min(body.evidence,75)*10 + Math.min(body.house,218)*10 + Math.min(body.senate,67)*30 + body.support*10 + body.capital + (body.won ? body.daysRemaining*5 : 0);
  return {...body,name,score};
}
export function json(data, status=200, headers={}) {
 return new Response(JSON.stringify(data), {status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store',...headers}});
}
export function playerCookie(request) {
 const value=request.headers.get('cookie')?.split(';').map(x=>x.trim()).find(x=>x.startsWith('aoi_player='))?.slice(11);
 return /^[a-f0-9-]{36}$/.test(value || '') ? value : null;
}
