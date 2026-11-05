const fs=require('node:fs');
const vm=require('node:vm');
const assert=require('node:assert/strict');
const html=fs.readFileSync(fs.existsSync(__dirname+'/dist/index.html')?__dirname+'/dist/index.html':__dirname+'/index.html','utf8');
const scripts=[...html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g)].map(m=>m[1]);
scripts.forEach(s=>new vm.Script(s));
const ctx={Intl,Date,Number,Math};vm.createContext(ctx);vm.runInContext(scripts[0]+';this.f=Finance;',ctx);const f=ctx.f;
let checks=0;function eq(a,b){checks++;assert.ok(Math.abs(a-b)<1e-7,`${a} != ${b}`)}
eq(f.savings(100,10,24,0).value,340);
eq(f.savings(100,0,24,3).value,106.09);
eq(f.savings(0,10,1,3).value,10); // entrega no fim do mês
eq(f.savings(0,0,600,15).value,0);
eq(f.credit(600,0,12,20).payment,50);
eq(f.credit(600,0,12,20).total,620);
const a=f.credit(600,12,12,20),b=f.credit(600,12,24,20);
assert.ok(b.payment<a.payment && b.total>a.total);checks++;
eq(a.total-a.interest-a.fees,600);
const budget=f.budget(100,35,20,25,10,15);
eq(budget.free,-5);eq(budget.remaining,30);eq(budget.allocated,105);
eq(f.budget(0,0,0,0,0).free,0);
const entries={'2026-11-05':5};let goal=f.goal(120,20,entries);eq(goal.total,25);
entries['2026-11-05']=7;eq(f.goal(120,20,entries).total,27);
eq(f.goal(10,20,{}).remaining,0);eq(f.goal(10,20,{}).percent,100);
eq(f.days('2026-12-31','2027-01-01'),1);
eq(f.days('2026-03-28','2026-03-30'),2);
const pA=f.buy(2.4,1,2),pB=f.buy(6.9,3,2,1.5);
eq(pA.total,4.8);eq(pB.total,8.4);eq(pB.unit,2.3);eq(pB.excess,1);
assert.ok(f.buy(6.9,3,6).total<f.buy(2.4,1,6).total);checks++;
const tax=f.vat(120,20,true);eq(tax.net,100);eq(tax.tax,20);eq(tax.total,120);
eq(f.vat(100,20,false).total,120);eq(f.vat(100,0,true).net,100);
const business=f.business(3,1.2,15,40);eq(business.revenue,120);eq(business.cost,63);eq(business.profit,57);eq(business.breakEven,9);
assert.equal(f.business(1,2,10,20).breakEven,null);checks++;
for(let i=0;i<600;i+=20){const r=f.savings(50,5,i,3);assert.ok(r.value>=r.paid-1e-7);checks++}
assert.ok(html.includes('lang="pt-PT"') && html.includes('TIC, Educação e WEB'));checks++;
assert.ok(!/<(?:script|link)[^>]+(?:src|href)="https?:/.test(html));checks++;
const ui=scripts[1];
function sandbox(stored={}){
 const mem=new Map(Object.entries(stored)),nodes=new Map();
 const el=id=>{if(!nodes.has(id))nodes.set(id,{value:'',innerHTML:'',textContent:'',style:{},dataset:{},labels:[],checkValidity:()=>true,addEventListener:()=>{},focus:()=>{},setAttribute:()=>{},querySelector:()=>({outerHTML:'<svg></svg>'})});return nodes.get(id)};
 const cx={Intl,Date,Number,Math,JSON,Array,Object,String,Set,Map,RegExp,console,Blob,URL:{createObjectURL:()=>'',revokeObjectURL:()=>{}},setTimeout:()=>{},localStorage:{getItem:k=>mem.get(k)||null,setItem:(k,v)=>mem.set(k,v),removeItem:k=>mem.delete(k)},location:{hash:'',hostname:'localhost'},history:{replaceState:(a,b,v)=>{cx.location.hash=v}},document:{querySelector:el,querySelectorAll:()=>[],addEventListener:()=>{},documentElement:{dataset:{}},createElement:()=>({click:()=>{},remove:()=>{}}),body:{append:()=>{}}},window:{addEventListener:()=>{},scrollTo:()=>{},print:()=>{}}};
 vm.createContext(cx);vm.runInContext(scripts[0],cx);vm.runInContext(ui.replace("go(location.hash.slice(1)||'inicio',false);",''),cx);
 return {run:s=>vm.runInContext(s,cx),mem,nodes};
}
let app=sandbox();
const levels=['primeiro','segundo','terceiro','secundario'];
const budgets=[20,40,60,450],labCounts=[5,6,7,8],questionStarts=new Set(),allQuestions=new Set();
for(let i=0;i<levels.length;i++){
 const level=levels[i];app.run(`state=defaults('${level}');quizSession=null;lab='';`);
 const c=app.run('cfg()');assert.equal(c.budget,budgets[i]);checks++;
 assert.equal(app.run('currentLabs().length'),labCounts[i]);checks++;
 assert.equal(app.run('activityIds().length'),labCounts[i]+2);checks++;
 for(const fn of ['home','mission','laboratory','learn','report','goalView']){const rendered=app.run(fn+'()');assert.ok(rendered.length>100);assert.ok(!/\$\{(?:cfg|c\.|esc)/.test(rendered),level+' '+fn+' '+rendered.match(/.{0,50}\$\{.{0,120}/)?.[0]);checks+=2}
 assert.ok(app.run('home()').includes(c.missionTitle));checks++;
 assert.ok(app.run('mission()').includes('max="'+budgets[i]+'"'));checks++;
 const bank=app.run('questionBanks[state.level]');assert.equal(bank.length,6);checks++;
 for(const q of bank){allQuestions.add(q[0]);assert.ok(q[1].length===3&&Number.isInteger(q[2])&&q[2]>=0&&q[2]<3&&q[3].length>25);checks++}
 questionStarts.add(bank[0][0]);
 for(const id of c.labs){app.run(`lab='${id}'`);const rendered=app.run('laboratory()');assert.ok(rendered.includes(c.name));checks++}
 app.run("lab=''");
}
assert.equal(questionStarts.size,4);assert.equal(allQuestions.size,24);checks+=2;
app.run("state=defaults('primeiro');");
assert.ok(app.run('savingsView()').includes('Quantas semanas?'));checks++;
assert.ok(!app.run('savingsView()').includes('Taxa anual'));checks++;
assert.ok(app.run('moneyCoins(2.37)').includes('37 cêntimos'));checks++;
assert.ok(!app.run('businessView()').includes('id="n-produced"'));checks++;
app.run("state=defaults('segundo');");assert.ok(app.run('taxView()').includes('200'));assert.ok(!app.run('taxView()').includes('id="tax-form"'));checks+=2;
app.run("state=defaults('secundario');");assert.ok(app.run('businessView()').includes('id="n-produced"'));checks++;
app.run("state.mission={plan:200,choices:[0,1,1,0],pending:null,reflection:''}");
eq(app.run('missionBalance()'),292);eq(app.run('missionDebt()'),160);eq(app.run('missionSaved()'),132);
assert.ok(app.run('mission()').includes('182,00'));checks++;
eq(f.stockBusiness(12,7,80,60,40).profit,-20);eq(f.stockBusiness(12,7,80,60,40).breakEven,42);
eq(f.risk(100,1,8,1),106.92);assert.ok(f.risk(100,5,8,1)<f.risk(100,5,8,0));checks++;
// Every affordable branch conserves money; future instalments never inflate free savings.
for(const level of levels){app.run(`state=defaults('${level}');`);const E=app.run('currentEvents()'),c=app.run('cfg()');for(let n=0;n<81;n++){let code=n,cash=c.budget,valid=true,cs=[];for(let i=0;i<4;i++){const choice=code%3;code=Math.floor(code/3);if(E[i].options[choice][1]>cash){valid=false;break}cash-=E[i].options[choice][1];cs.push(choice)}if(!valid)continue;app.run(`state.mission={plan:${c.plan},choices:${JSON.stringify(cs)},pending:null,reflection:''}`);eq(app.run('missionBalance()'),cash);assert.ok(app.run('missionSaved()')<=cash);checks++}}
// Switching and reloading retain each cycle's own mission, inputs, reflection and quiz draft.
app=sandbox();app.run("state=defaults('primeiro');state.mission={plan:8,choices:[0],pending:null,reflection:'Primeiro'};state.reflection='Um';state.labValues['s-monthly']='2';quizSession={level:'primeiro',index:1,score:1,selected:null,tried:false,answers:[1]};save();switchLevel('segundo');state.reflection='Dois';state.labValues['s-monthly']='9';save();switchLevel('primeiro');");
assert.equal(app.run('state.reflection'),'Um');assert.equal(app.run("state.labValues['s-monthly']"),'2');assert.equal(app.run('state.mission.choices.length'),1);assert.equal(app.run('quizSession.index'),1);checks+=4;
const reloaded=sandbox(Object.fromEntries(app.mem));assert.equal(reloaded.run('state.level'),'primeiro');assert.equal(reloaded.run('quizSession.index'),1);reloaded.run("switchLevel('segundo')");assert.equal(reloaded.run('state.reflection'),'Dois');assert.equal(reloaded.run("state.labValues['s-monthly']"),'9');checks+=4;
// A result completed in one cycle must not be relabelled as a different cycle on upgrade.
const old={version:1,level:'secundario',completed:['missao','quiz','meta','credito'],quiz:{level:'terceiro',score:5,answers:[0,1,2,1,0,2],reflection:'Antes'},mission:{plan:30,choices:[1,1,0,1],pending:null,reflection:'Antiga'},goal:{name:'Visita',target:120,initial:20,start:'2026-11-05',deadline:'2026-12-05',entries:{'2026-11-05':7}},results:{credito:'Custo anterior: 620 €'},labValues:{'k-capital':'600'}};
const upgraded=sandbox({'financajovem-lab-v1':JSON.stringify(old)});
assert.equal(upgraded.run('state.level'),'secundario');assert.equal(upgraded.run('state.mission'),null);assert.equal(upgraded.run('state.quiz'),null);assert.equal(upgraded.run('profiles.terceiro.quiz.score'),5);eq(upgraded.run('Finance.goal(state.goal.target,state.goal.initial,state.goal.entries).total'),27);assert.ok(upgraded.run('state.legacy.notes').includes('Custo anterior: 620 €'));assert.ok(!upgraded.run('state.completed').includes('credito'));checks+=6;
const oldCombined=sandbox({'financajovem-lab-v1':JSON.stringify({...old,level:'basico',quiz:{...old.quiz,level:'basico'}})});assert.equal(oldCombined.run('state.level'),'segundo');assert.equal(oldCombined.run('state.quiz'),null);assert.ok(oldCombined.run('state.legacy.notes.length')>0);checks+=3;
const broken=sandbox({'financajovem-lab-v1':'{invalid'});assert.equal(broken.run('state.level'),'terceiro');checks++;
console.log(`${checks} verificações aprovadas: cálculos, quatro percursos, 24 perguntas, missões, compromissos futuros, migração e retoma independente.`);
