// node test.js — 계산·가져오기 자체 점검
const fs=require('fs'),assert=require('assert');
const src=fs.readFileSync(__dirname+'/index.html','utf8').match(/<script>([\s\S]*)<\/script>/)[1];
const head=src.slice(0,src.indexOf('// ---------- 첨부 ----------'));
const g=new Function('localStorage','indexedDB','document',head+';return {calc,parseLog,importEvents,S,rosterShift,inferShift,needsCheck};')({getItem:()=>null,setItem(){}},{open:()=>({})},{});
const {calc,parseLog,importEvents,S}=g;
const c=(shift,ss,se,as,ae)=>calc({shift,schedStart:ss,schedEnd:se,actStart:as,actEnd:ae});
let z=c('D','07:00','15:00','06:30','15:20'); assert.deepStrictEqual([z.early,z.late,z.ot,z.night],[30,20,50,0],'D');
z=c('E','15:00','23:00','14:40','00:10'); assert.deepStrictEqual([z.early,z.late,z.ot,z.night],[20,70,90,70],'E 자정 넘김');
z=c('N','23:00','07:00','22:30','07:20'); assert.deepStrictEqual([z.early,z.late,z.ot,z.night],[30,20,50,30],'N');
z=c('N','23:00','07:00','23:10','06:50'); assert.deepStrictEqual([z.ot,z.night],[0,0],'N 초과 없음');
z=c('OFF','','','09:00','13:30'); assert.deepStrictEqual([z.ot,z.night],[270,0],'OFF 전체');
assert.strictEqual(c('D','07:00','15:00','','15:20').ok,false,'미완성');
// 가져오기: 점심 외출, 퇴근 누락, 나이트 자정 넘김, 출발만 있음
S.roster['2026-10']='DDN';S.settings.autoOffset=10;
let ev=parseLog('2026-10-01 06:31 in\n2026/10/1 12:01 out\n2026-10-01 12:40 in\n2026-10-01 15:22 out\n2026-10-02 06:40 in\n2026-10-03 22:25 in\n2026-10-04 07:30 out\n2026-10-05 15:30 out\n쓰레기 줄');
assert.strictEqual(ev.length,8,'파싱 줄 수');
let r=importEvents(ev); assert.deepStrictEqual([r.added,r.updated,r.dup,r.orphan],[3,0,0,1],'1차 가져오기 '+JSON.stringify(r));
const by=d=>S.records.find(x=>x.date===d);
assert.deepStrictEqual([by('2026-10-01').shift,by('2026-10-01').actStart,by('2026-10-01').actEnd,by('2026-10-01').locStart,by('2026-10-01').locEnd,by('2026-10-01').offsetMin],['D','06:41','15:12','06:31','15:22',10],'점심 외출 무시 + 이동 보정');
assert.deepStrictEqual(by('2026-10-01').rawLines,['2026-10-01 06:31 in','2026/10/1 12:01 out','2026-10-01 12:40 in','2026-10-01 15:22 out'],'원본 줄 보존');
assert.deepStrictEqual([by('2026-10-02').actEnd,g.needsCheck(by('2026-10-02'))],['',true],'퇴근 누락 확인 필요');
assert.deepStrictEqual([by('2026-10-03').shift,by('2026-10-03').actStart,by('2026-10-03').actEnd,calc(by('2026-10-03')).ot],['N','22:35','07:20',45],'나이트 자정 넘김 + 보정');
assert.deepStrictEqual([by('2026-10-05').shift,by('2026-10-05').actStart,by('2026-10-05').actEnd,by('2026-10-05').locEnd],['E','','15:20','15:30'],'출발만: 시각으로 근무조 추정 + 보정');
assert.strictEqual(by('2026-10-01').reason,'인수인계','초과 있으면 기본 사유');
// 짧은 근무(보정 2배 이하)는 보정 안 함
let r2=importEvents(parseLog('2026-10-06 10:00 in\n2026-10-06 10:15 out'));assert.deepStrictEqual([by('2026-10-06').actStart,by('2026-10-06').actEnd,by('2026-10-06').offsetMin],['10:00','10:15',0],'짧은 근무 보정 생략');
// 2차: 파일이 자라서 10/2 퇴근이 생김 → 기존 기록을 채움, 나머지는 중복
ev=parseLog('2026-10-01 06:31 in\n2026-10-01 12:01 out\n2026-10-01 12:40 in\n2026-10-01 15:22 out\n2026-10-02 06:40 in\n2026-10-02 15:10 out\n2026-10-03 22:25 in\n2026-10-04 07:30 out\n2026-10-05 15:30 out');
r=importEvents(ev); assert.deepStrictEqual([r.added,r.updated,r.dup,r.orphan],[0,1,3,0],'2차 가져오기 '+JSON.stringify(r));
assert.deepStrictEqual([by('2026-10-02').actEnd,by('2026-10-02').locEnd,by('2026-10-02').rawLines.length],['15:00','15:10',2],'재가져오기 보정·원본'); assert.strictEqual(S.records.length,5,'중복 생성 없음');
console.log('calc + import ok');
