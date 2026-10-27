// node test.js — 초과·야간 계산 자체 점검
const fs=require('fs'),assert=require('assert');
const src=fs.readFileSync(__dirname+'/index.html','utf8').match(/<script>([\s\S]*)<\/script>/)[1];
const head=src.slice(0,src.indexOf('// ---------- 기록 조작'));
const ctx={localStorage:{getItem:()=>null,setItem(){}},indexedDB:{open:()=>({})}};
const calc=new Function('localStorage','indexedDB',head+';return calc;')(ctx.localStorage,ctx.indexedDB);
const c=(shift,ss,se,as,ae)=>calc({shift,schedStart:ss,schedEnd:se,actStart:as,actEnd:ae});
let z=c('D','07:00','15:00','06:30','15:20'); assert.deepStrictEqual([z.early,z.late,z.ot,z.night],[30,20,50,0],'D');
z=c('E','15:00','23:00','14:40','00:10'); assert.deepStrictEqual([z.early,z.late,z.ot,z.night],[20,70,90,70],'E 자정 넘김');
z=c('N','23:00','07:00','22:30','07:20'); assert.deepStrictEqual([z.early,z.late,z.ot,z.night],[30,20,50,30],'N');
z=c('N','23:00','07:00','23:10','06:50'); assert.deepStrictEqual([z.ot,z.night],[0,0],'N 초과 없음');
z=c('OFF','','','09:00','13:30'); assert.deepStrictEqual([z.ot,z.night],[270,0],'OFF 전체');
z=c('D','07:00','15:00','','15:20'); assert.strictEqual(z.ok,false,'미완성');
console.log('calc ok');
