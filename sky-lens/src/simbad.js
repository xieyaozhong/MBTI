const ENDPOINT='https://simbad.cds.unistra.fr/simbad/sim-tap/sync';
const clean=v=>String(v??'').replace(/\s+/g,' ').trim();
const kind=t=>{const v=t.toLowerCase();if(v.includes('gal')||v==='g')return'galaxy';if(v.includes('neb'))return v.includes('planet')?'planetary-nebula':'nebula';if(v.includes('cl')||v.includes('cluster'))return'cluster';if(v.includes('*')||v.includes('star'))return'star';return'other';};
export async function querySimbadCone(raHours,decDeg,radiusDeg=4,limit=180){
 const ra=Math.max(0,Math.min(360,raHours*15)),dec=Math.max(-90,Math.min(90,decDeg)),radius=Math.max(.1,Math.min(10,radiusDeg)),top=Math.max(1,Math.min(500,Math.floor(limit)));
 const query=`SELECT TOP ${top} main_id, ra, dec, otype FROM basic WHERE CONTAINS(POINT('ICRS', ra, dec), CIRCLE('ICRS', ${ra}, ${dec}, ${radius})) = 1`;
 const body=new URLSearchParams({REQUEST:'doQuery',LANG:'ADQL',FORMAT:'json',QUERY:query}).toString();
 const response=await fetch(ENDPOINT,{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded;charset=UTF-8'},body});
 if(!response.ok)throw new Error(`SIMBAD 查詢失敗（HTTP ${response.status}）`);
 const payload=await response.json(),metadata=payload.metadata??[],rows=payload.data??[];
 const columns=new Map(metadata.map((c,i)=>[c.name?.toLowerCase(),i]));
 const ni=columns.get('main_id')??0,ri=columns.get('ra')??1,di=columns.get('dec')??2,ti=columns.get('otype')??3;
 return rows.flatMap((row,index)=>{const r=Number(row[ri]),d=Number(row[di]);if(!Number.isFinite(r)||!Number.isFinite(d))return[];const name=clean(row[ni])||`SIMBAD ${index+1}`;return[{id:`simbad-${name}-${r.toFixed(5)}-${d.toFixed(5)}`,name,raHours:r/15,decDeg:d,kind:kind(clean(row[ti])),source:'simbad'}];});
}
