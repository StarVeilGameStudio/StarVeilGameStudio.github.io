const $=id=>document.getElementById(id);
const ATTRS=["STR","AGI","VIT","INT","WIS","SEN"];
const ATTR_NAMES={STR:"Força",AGI:"Agilidade",VIT:"Vitalidade",INT:"Inteligência",WIS:"Sabedoria",SEN:"Percepção"};
const XP={easy:10,normal:25,hard:50,epic:100,legendary:200};
const DIFF={easy:"Fácil",normal:"Normal",hard:"Difícil",epic:"Épica",legendary:"Lendária"};
const today=()=>{const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`};
const yesterday=()=>{const d=new Date();d.setDate(d.getDate()-1);return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`};
const fresh=()=>({xp:0,level:1,stats:{STR:1,AGI:1,VIT:1,INT:1,WIS:1,SEN:1},quests:[],log:[],lastDate:today()});
let data;
try{data=JSON.parse(localStorage.getItem("systemHunterSave"))||fresh()}catch{data=fresh()}
function save(){localStorage.setItem("systemHunterSave",JSON.stringify(data))}
function toast(s){const t=$("toast");t.textContent=s;t.style.display="block";clearTimeout(window.toastTimer);window.toastTimer=setTimeout(()=>t.style.display="none",2300)}
function rankFor(l){return l>=25?"S":l>=20?"A":l>=15?"B":l>=10?"C":l>=5?"D":"E"}
function normalizeDay(){
 const t=today(); if(data.lastDate===t)return;
 if(data.lastDate===yesterday()){
  data.quests.filter(q=>q.frequency==="daily"&&q.lastCompleted!==t&&q.lastCompleted!==yesterday()).forEach(q=>{if(q.streak>0){q.streak=0;data.log.unshift({date:t,text:`Sequência perdida: ${q.name}`,xp:0})}});
  data.quests.filter(q=>q.frequency==="daily"&&q.lastCompleted!==t&&q.lastCompleted===yesterday()).forEach(q=>{q.streak=q.streak||0});
 } else {
  data.quests.filter(q=>q.frequency==="daily"&&q.lastCompleted!==t).forEach(q=>{if(q.streak>0){q.streak=0;data.log.unshift({date:t,text:`Sequência perdida: ${q.name}`,xp:0})}});
 }
 data.lastDate=t;save();
}
function levelInfo(){const level=Math.floor(data.xp/100)+1;data.level=level;return {level,within:data.xp%100,rank:rankFor(level)}}
function render(){
 normalizeDay();const {level,within,rank}=levelInfo();
 $("rank").textContent=rank;$("level").textContent=`LEVEL ${String(level).padStart(2,"0")}`;
 $("hunterTitle").textContent=({E:"NOVICE HUNTER",D:"APPRENTICE HUNTER",C:"INTERMEDIATE HUNTER",B:"ADVANCED HUNTER",A:"ELITE HUNTER",S:"NATIONAL-LEVEL HUNTER"})[rank];
 $("xpText").textContent=`${within} / 100 XP · ${data.xp} TOTAL`;$("xpFill").style.width=within+"%";
 $("stats").innerHTML=ATTRS.map(a=>`<div class="stat"><div class="statrow"><b>${a}</b><strong>${data.stats[a]||1}</strong></div><div class="track"><div class="fill" style="width:${Math.min(100,(data.stats[a]||1)*5)}%"></div></div><div class="small">${ATTR_NAMES[a]}</div></div>`).join("");
 const active=data.quests.filter(q=>q.active!==false);
 const todayDone=active.filter(q=>q.lastCompleted===today()).length;
 $("questCount").textContent=`${todayDone} / ${active.length} concluídas`;
 const todayList=active.filter(q=>q.frequency==="daily"||q.lastCompleted!==today());
 $("todayQuests").innerHTML=todayList.length?todayList.map(q=>questHTML(q)).join(""):`<div class="empty">Nenhuma missão pendente. Adicione suas próprias missões na aba MISSÕES.</div>`;
 $("allCount").textContent=`${active.length} ATIVAS`;
 $("allQuests").innerHTML=active.length?active.map(q=>questHTML(q,true)).join(""):`<div class="empty">Seu quadro está vazio. Crie sua primeira missão.</div>`;
 const logs=data.log.slice(0,5);$("recent").innerHTML=logs.length?logs.map(logHTML).join(""):`<div class="empty">Nenhum registro ainda.</div>`;
 $("historyList").innerHTML=data.log.length?data.log.map(logHTML).join(""):`<div class="empty">Seu histórico aparecerá aqui.</div>`;
}
function questHTML(q,manage=false){const done=q.lastCompleted===today();return `<div class="quest ${done?"done":""}"><button class="check" ${done?"disabled":""} data-complete="${q.id}" aria-label="Concluir missão">${done?"✓":""}</button><div class="questmain"><div class="questtitle">${esc(q.name)}</div><div class="questmeta">${DIFF[q.difficulty]} · ${q.attribute} · ${q.frequency==="daily"?"DIÁRIA":"ÚNICA"}${q.frequency==="daily"?" · 🔥 "+(q.streak||0):""}</div></div><div class="reward">+${XP[q.difficulty]} XP</div>${manage?`<button class="check" data-delete="${q.id}" title="Excluir missão">×</button>`:""}</div>`}
function logHTML(x){return `<div class="logitem"><span>${esc(x.text)}<br><span class="small">${x.date}</span></span><b style="color:${x.xp>0?"var(--green)":"var(--muted)"}">${x.xp>0?"+"+x.xp+" XP":""}</b></div>`}
function esc(s){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
$("questForm").addEventListener("submit",e=>{e.preventDefault();const name=$("qname").value.trim();if(!name)return;data.quests.push({id:crypto.randomUUID?crypto.randomUUID():String(Date.now()+Math.random()),name,difficulty:$("difficulty").value,attribute:$("attribute").value,frequency:$("frequency").value,streak:0,lastCompleted:null,active:true});save();$("qname").value="";render();toast("MISSÃO REGISTRADA PELO SYSTEM.")});
document.addEventListener("click",e=>{
 const c=e.target.closest("[data-complete]");if(c){complete(c.dataset.complete);return}
 const d=e.target.closest("[data-delete]");if(d&&confirm("Excluir esta missão?")){data.quests=data.quests.filter(q=>q.id!==d.dataset.delete);save();render();toast("MISSÃO EXCLUÍDA.")}
});
function complete(id){const q=data.quests.find(x=>x.id===id);if(!q||q.lastCompleted===today())return;const before=rankFor(data.level);const amount=XP[q.difficulty];data.xp+=amount;data.stats[q.attribute]=(data.stats[q.attribute]||1)+1;if(q.frequency==="daily"){q.streak=(q.lastCompleted===yesterday()?(q.streak||0)+1:1)}q.lastCompleted=today();data.log.unshift({date:today(),text:q.name,xp:amount});data.log=data.log.slice(0,200);save();render();const after=rankFor(Math.floor(data.xp/100)+1);toast(after!==before?`RANK UP! NOVA PATENTE ${after}`:`MISSÃO CONCLUÍDA · +${amount} XP`)}
document.querySelectorAll(".tabs button").forEach(b=>b.addEventListener("click",()=>{document.querySelectorAll(".tabs button").forEach(x=>x.classList.toggle("active",x===b));document.querySelectorAll(".view").forEach(v=>v.classList.toggle("active",v.id===b.dataset.view));}));
$("exportBtn").addEventListener("click",()=>{const blob=new Blob([JSON.stringify(data,null,2)],{type:"application/json"});const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="system-backup.json";a.click();URL.revokeObjectURL(a.href);toast("BACKUP EXPORTADO.")});
$("importFile").addEventListener("change",async e=>{const f=e.target.files[0];if(!f)return;try{const x=JSON.parse(await f.text());if(!x.quests||!x.stats||typeof x.xp!=="number")throw Error();data=x;save();render();toast("BACKUP RESTAURADO.")}catch{toast("ARQUIVO DE BACKUP INVÁLIDO.")}e.target.value=""});
$("resetBtn").addEventListener("click",()=>{if(confirm("Tem certeza? Todo o progresso será apagado.")){data=fresh();save();render();toast("SYSTEM REINICIALIZADO.")}});
if("serviceWorker" in navigator && location.protocol!=="file:"){window.addEventListener("load",()=>navigator.serviceWorker.register("./sw.js").catch(()=>{}))}
render();