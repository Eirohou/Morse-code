import { useState, useEffect, useCallback, useRef } from “react”;

// ═══════════════════════ DATA ═══════════════════════
const MORSE={A:”.-”,B:”-…”,C:”-.-.”,D:”-..”,E:”.”,F:”..-.”,G:”–.”,H:”….”,I:”..”,J:”.—”,K:”-.-”,L:”.-..”,M:”–”,N:”-.”,O:”—”,P:”.–.”,Q:”–.-”,R:”.-.”,S:”…”,T:”-”,U:”..-”,V:”…-”,W:”.–”,X:”-..-”,Y:”-.–”,Z:”–..”,
“Ą”:”.-.-”,“Ć”:”-.-..”,“Ę”:”..-..”,“Ł”:”.-..-”,“Ń”:”–.–”,“Ó”:”—.”,“Ś”:”…-…”,“Ź”:”–..-.”,“Ż”:”–..-”,
“0”:”—–”,“1”:”.––”,“2”:”..—”,“3”:”…–”,“4”:”….-”,“5”:”…..”,“6”:”-….”,“7”:”–…”,“8”:”—..”,“9”:”––.”,
“.”:”.-.-.-”,”,”:”–..–”,”?”:”..–..”,”!”:”-.-.–”,”/”:”-..-.”,
“(”:”-.–.”,”)”:”-.–.-”,”&”:”.-…”,”=”:”-…-”,”+”:”.-.-.”,”-”:”-….-”};
const REV=Object.fromEntries(Object.entries(MORSE).map(([k,v])=>[v,k]));
const CATS={“A-Z”:“ABCDEFGHIJKLMNOPQRSTUVWXYZ”.split(””),“PL”:[“Ą”,“Ć”,“Ę”,“Ł”,“Ń”,“Ó”,“Ś”,“Ź”,“Ż”],“0-9”:“0123456789”.split(””),”.:?”:[”.”,”,”,”?”,”!”,”/”,”(”,”)”,”&”,”=”,”+”,”-”]};

const PROSIGNS=[
{sign:“AR”,morse:”.-.-.”,meaning:“End of message”},{sign:“AS”,morse:”.-…”,meaning:“Wait / Stand by”},
{sign:“BT”,morse:”-…-”,meaning:“Break / New paragraph”},{sign:“CL”,morse:”-.-..-..”,meaning:“Closing station”},
{sign:“CT”,morse:”-.-.-”,meaning:“Attention”},{sign:“KN”,morse:”-.–.”,meaning:“Invite specific station”},
{sign:“SK”,morse:”…-.-”,meaning:“End of contact”},{sign:“SN”,morse:”…-.”,meaning:“Understood”},
{sign:“SOS”,morse:”…—…”,meaning:“Distress signal”},{sign:“HH”,morse:”……..”,meaning:“Error / Correction”},
{sign:“K”,morse:”-.-”,meaning:“Over / Invite to transmit”},{sign:“R”,morse:”.-.”,meaning:“Roger / Received”},
];
const CW_ABBR=[
{a:“73”,m:“Best regards”},{a:“88”,m:“Love and kisses”},{a:“CQ”,m:“Calling any station”},
{a:“DE”,m:“From (this is…)”},{a:“DX”,m:“Long distance”},{a:“ES”,m:“And”},
{a:“FB”,m:“Fine business”},{a:“GM”,m:“Good morning”},{a:“GA”,m:“Good afternoon”},
{a:“GE”,m:“Good evening”},{a:“HI”,m:“Laughter”},{a:“HR”,m:“Here”},
{a:“HW”,m:“How copy?”},{a:“NR”,m:“Number”},{a:“OM”,m:“Old man”},
{a:“OP”,m:“Operator”},{a:“PSE”,m:“Please”},{a:“RST”,m:“Readability-Strength-Tone”},
{a:“RX”,m:“Receiver”},{a:“TX”,m:“Transmitter”},{a:“TNX”,m:“Thanks”},
{a:“UR”,m:“Your”},{a:“VY”,m:“Very”},{a:“WX”,m:“Weather”},
{a:“XYL”,m:“Wife”},{a:“YL”,m:“Young lady”},{a:“55”,m:“Good luck”},{a:“99”,m:“Go away”},
];
const Q_CODES=[
{code:“QRA”,q:“What is your station name?”,a:“My station name is …”},
{code:“QRB”,q:“How far are you?”,a:“Distance is … km.”},
{code:“QRG”,q:“What is my exact frequency?”,a:“Your frequency is … kHz.”},
{code:“QRK”,q:“What is my readability?”,a:“Readability 1(bad)–5(perfect).”},
{code:“QRL”,q:“Is this frequency in use?”,a:“This frequency is in use.”},
{code:“QRM”,q:“Am I being interfered with?”,a:“You are being interfered with.”},
{code:“QRN”,q:“Are you troubled by static?”,a:“I am troubled by static.”},
{code:“QRO”,q:“Shall I increase power?”,a:“Increase power.”},
{code:“QRP”,q:“Shall I decrease power?”,a:“Decrease power.”},
{code:“QRQ”,q:“Shall I send faster?”,a:“Send faster.”},
{code:“QRS”,q:“Shall I send slower?”,a:“Send more slowly.”},
{code:“QRT”,q:“Shall I stop sending?”,a:“Stop sending.”},
{code:“QRU”,q:“Have you anything for me?”,a:“I have nothing for you.”},
{code:“QRV”,q:“Are you ready?”,a:“I am ready.”},
{code:“QRX”,q:“When will you call again?”,a:“I will call at … hours.”},
{code:“QRZ”,q:“Who is calling me?”,a:“You are being called by …”},
{code:“QSA”,q:“What is my signal strength?”,a:“Strength 1–5.”},
{code:“QSB”,q:“Are my signals fading?”,a:“Your signals are fading.”},
{code:“QSD”,q:“Is my keying defective?”,a:“Your keying is defective.”},
{code:“QSK”,q:“Can you hear between signals?”,a:“I can hear you (break-in).”},
{code:“QSL”,q:“Can you acknowledge receipt?”,a:“I acknowledge receipt.”},
{code:“QSO”,q:“Can you communicate directly?”,a:“I can communicate directly.”},
{code:“QSP”,q:“Will you relay?”,a:“I will relay.”},
{code:“QST”,q:null,a:“General call to all stations.”},
{code:“QSY”,q:“Shall I change frequency?”,a:“Change frequency.”},
{code:“QTC”,q:“How many messages?”,a:“I have … messages.”},
{code:“QTH”,q:“What is your position?”,a:“My position is …”},
{code:“QTR”,q:“What is the correct time?”,a:“The time is … UTC.”},
];
const Q_SCEN=[
{s:“You want to check if the frequency is occupied.”,a:“QRL”},
{s:“Other stations are causing interference.”,a:“QRM”},
{s:“You need the operator to slow down.”,a:“QRS”},
{s:“You want to know the station’s location.”,a:“QTH”},
{s:“You confirm receipt of a message.”,a:“QSL”},
{s:“You are ending transmission.”,a:“QRT”},
{s:“Someone called but you missed the callsign.”,a:“QRZ”},
{s:“Ask the station to increase power.”,a:“QRO”},
{s:“You are operating low power.”,a:“QRP”},
{s:“Confirm the other station is ready.”,a:“QRV”},
{s:“You need to move to another frequency.”,a:“QSY”},
{s:“You need the current UTC time.”,a:“QTR”},
{s:“You want the station to send faster.”,a:“QRQ”},
{s:“Heavy atmospheric noise.”,a:“QRN”},
{s:“You need to relay a message.”,a:“QSP”},
{s:“You have no further traffic.”,a:“QRU”},
{s:“Check your signal readability.”,a:“QRK”},
{s:“Making a general announcement.”,a:“QST”},
];
const PL_WORDS={
s:[“TAK”,“NIE”,“DOM”,“KOT”,“LAS”,“DWA”,“TEN”,“PAN”,“RAZ”,“JAK”,“ALE”,“ONA”,“POD”,“NAD”,“DLA”],
m:[“POLSKA”,“MORZE”,“DZIEŃ”,“NUMER”,“RADIO”,“PUNKT”,“ZNAK”,“RĘKA”,“PIĘĆ”,“ŁÓDŹ”],
l:[“TELEGRAM”,“NADAWANIE”,“SYGNAŁ”,“ODBIÓR”,“ŁĄCZNOŚĆ”,“ANTENA”,“KOMUNIKAT”,“WIADOMOŚĆ”,“TRANSMISJA”],
p:[“CQ CQ CQ”,“SOS SOS”,“DZIEŃ DOBRY”,“DOBRY WIECZÓR”,“DO WIDZENIA”,“PROSZĘ POWTÓRZYĆ”,“ODBIÓR ZAKOŃCZONY”],
};
const PL_SENTENCES=[“RADAR WYKRYŁ OBIEKT NA PÓŁNOCY”,“ZMIANA CZĘSTOTLIWOŚCI O SZESNASTEJ”,“WIADOMOŚĆ ODEBRANA POPRAWNIE”,“PROSZĘ O POWTÓRZENIE SYGNAŁU”,“ŁĄCZNOŚĆ ZAKOŃCZONA DZIĘKUJĘ”,“JEDNOSTKA W DRODZE DO BAZY”,“POTWIERDZAM ODBIÓR KOMUNIKATU”];
const SP_CALLS=[“SP1ABC”,“SP2DEF”,“SP3GHI”,“SP5JKL”,“SP9MNO”,“SQ2XYZ”,“SQ5AAA”,“SP7BBB”,“SQ1CCC”,“SP6DDD”,“SP4EEE”,“SQ8FFF”];
const QSO_TPL=[
{rx:“CQ CQ CQ DE {call} {call} K”,expect:“callsign”,hint:“Respond: {call} DE SP1YOU SP1YOU K”},
{rx:”{call} DE SP1YOU UR RST 599 QTH WARSZAWA NAME MAREK HW K”,expect:“exchange”,hint:“Send RST, QTH, and name back”},
{rx:“TNX FER RPRT QSL 73 DE {call} SK”,expect:“closing”,hint:“Close: TNX 73 DE SP1YOU SK”},
];

// ═══════════════════════ ACHIEVEMENTS ═══════════════════════
const BADGES=[
{id:“first_drill”,name:“Szeregowy”,nameEn:“Private”,desc:“Complete your first drill”,icon:“⭐”,check:s=>s.totalCorrect>=1},
{id:“fifty”,name:“St. Szeregowy”,nameEn:“Private 1st Class”,desc:“50 correct answers”,icon:“🎖️”,check:s=>s.totalCorrect>=50},
{id:“wpm5”,name:“Kapral”,nameEn:“Corporal”,desc:“Reach 5 WPM on Speed Ladder”,icon:“🏅”,check:s=>s.maxLadderWpm>=5},
{id:“hundred”,name:“Sierżant”,nameEn:“Sergeant”,desc:“100 correct answers, 75%+ accuracy”,icon:“🎗️”,check:s=>s.totalCorrect>=100&&s.totalAttempts>0&&(s.totalCorrect/s.totalAttempts)>=.75},
{id:“wpm12”,name:“St. Sierżant”,nameEn:“Staff Sergeant”,desc:“Reach 12 WPM on Speed Ladder”,icon:“🏆”,check:s=>s.maxLadderWpm>=12},
{id:“nato12”,name:“Chorąży”,nameEn:“Warrant Officer”,desc:“Pass NATO exam at 12 WPM”,icon:“🛡️”,check:s=>s.natoPassWpm>=12},
{id:“sprint50”,name:“Podporucznik”,nameEn:“2nd Lieutenant”,desc:“50+ in a 60-second sprint”,icon:“⚔️”,check:s=>s.bestSprint>=50},
{id:“wpm16”,name:“Porucznik”,nameEn:“Lieutenant”,desc:“Reach 16 WPM on Speed Ladder”,icon:“🗡️”,check:s=>s.maxLadderWpm>=16},
{id:“nato16”,name:“Kapitan”,nameEn:“Captain”,desc:“Pass NATO exam at 16 WPM”,icon:“🎯”,check:s=>s.natoPassWpm>=16},
{id:“fivehundred”,name:“Major”,nameEn:“Major”,desc:“500 correct answers total”,icon:“💎”,check:s=>s.totalCorrect>=500},
{id:“wpm20”,name:“Podpułkownik”,nameEn:“Lt. Colonel”,desc:“Reach 20 WPM on Speed Ladder”,icon:“👑”,check:s=>s.maxLadderWpm>=20},
{id:“nato20”,name:“Pułkownik”,nameEn:“Colonel”,desc:“Pass NATO exam at 20 WPM”,icon:“🦅”,check:s=>s.natoPassWpm>=20},
{id:“thousand”,name:“Generał”,nameEn:“General”,desc:“1000 correct, 25 WPM ladder”,icon:“⭐⭐”,check:s=>s.totalCorrect>=1000&&s.maxLadderWpm>=25},
{id:“qso_complete”,name:“Radiowiec”,nameEn:“Radioman”,desc:“Complete a simulated QSO”,icon:“📻”,check:s=>s.qsoCompleted>=1},
{id:“noise_master”,name:“Zakłóceniowiec”,nameEn:“Noise Master”,desc:“Pass NATO exam with noise at 50%+”,icon:“🌩️”,check:s=>s.natoPassNoise>=50},
{id:“all_qcodes”,name:“Kodowiec”,nameEn:“Code Expert”,desc:“100% on 20 consecutive Q-code questions”,icon:“📜”,check:s=>s.qcodeStreak>=20},
];

const DEF_STATS={totalCorrect:0,totalAttempts:0,maxLadderWpm:0,bestLadderStreak:0,natoPassWpm:0,natoPassNoise:0,bestSprint:0,qsoCompleted:0,qcodeStreak:0,charStats:{},unlockedBadges:[],lastActive:null};

// ═══════════════════════ AUDIO ═══════════════════════
const wpm2t=w=>{const d=1200/w;return{dot:d,dash:d*3,symGap:d,charGap:d*3,wordGap:d*7};};
const farnsworth=(wpm,eff)=>{const ct=wpm2t(wpm);const et=wpm2t(eff);return{…ct,charGap:et.charGap,wordGap:et.wordGap};};
const DEF_T={dot:100,dash:300,symGap:100,charGap:300,wordGap:700};
const WPM_P=[5,8,12,16,20,25];

function makeNoise(ctx,level,duration){
if(!level||!ctx)return;
const buf=ctx.createBuffer(1,ctx.sampleRate*duration,ctx.sampleRate);
const d=buf.getChannelData(0);
for(let i=0;i<d.length;i++)d[i]=(Math.random()*2-1)*level*0.3;
const src=ctx.createBufferSource();src.buffer=buf;
const filt=ctx.createBiquadFilter();filt.type=“bandpass”;filt.frequency.value=800;filt.Q.value=2;
const g=ctx.createGain();g.gain.value=level;
src.connect(filt).connect(g).connect(ctx.destination);
src.start();src.stop(ctx.currentTime+duration);
}

function playM(code,ctx,t,noise=0){
if(!ctx)return Promise.resolve();
const t0=ctx.currentTime+0.05;let c=t0;
for(const s of code){
const d=s===”.”?t.dot/1000:t.dash/1000;
const o=ctx.createOscillator(),g=ctx.createGain();
o.frequency.value=660;o.type=“sine”;
g.gain.setValueAtTime(0,c);g.gain.linearRampToValueAtTime(0.35,c+0.004);
g.gain.setValueAtTime(0.35,c+d-0.004);g.gain.linearRampToValueAtTime(0,c+d);
o.connect(g).connect(ctx.destination);o.start(c);o.stop(c+d);
c+=d+t.symGap/1000;
}
const dur=c-t0+0.1;
if(noise>0)makeNoise(ctx,noise,dur);
return new Promise(r=>setTimeout(r,dur*1000+50));
}
async function playW(w,ctx,t,noise=0){
if(noise>0)makeNoise(ctx,noise,w.length*0.5);
for(let i=0;i<w.length;i++){
const ch=w[i].toUpperCase();
if(ch===” “){await new Promise(r=>setTimeout(r,t.wordGap));continue;}
const code=MORSE[ch];
if(code){await playM(code,ctx,t,0);if(i<w.length-1&&w[i+1]!==” “)await new Promise(r=>setTimeout(r,t.charGap));}
}
}

// ═══════════════════════ STORAGE ═══════════════════════
const memStore = {};
async function loadStats(){
try {
if (typeof window !== “undefined” && window.storage && typeof window.storage.get === “function”) {
const r = await window.storage.get(“morsepl-stats”);
if (r && r.value) return { …DEF_STATS, …JSON.parse(r.value) };
}
} catch(e) { console.warn(“storage load err”, e); }
if (memStore.stats) return { …DEF_STATS, …memStore.stats };
return { …DEF_STATS };
}
async function saveStats(s){
memStore.stats = s;
try {
if (typeof window !== “undefined” && window.storage && typeof window.storage.set === “function”) {
await window.storage.set(“morsepl-stats”, JSON.stringify({ …s, lastActive: new Date().toISOString() }));
}
} catch(e) { console.warn(“storage save err”, e); }
}

function useStats(){
const [stats, setStats] = useState({ …DEF_STATS });
const [loaded, setLoaded] = useState(false);
useEffect(() => {
let cancelled = false;
loadStats().then(s => { if (!cancelled) { setStats(s); setLoaded(true); } });
return () => { cancelled = true; };
}, []);
const update = useCallback((fn) => {
setStats(prev => {
const next = fn(prev);
const unlocked = […(next.unlockedBadges || [])];
BADGES.forEach(b => { if (!unlocked.includes(b.id) && b.check(next)) unlocked.push(b.id); });
const final = { …next, unlockedBadges: unlocked };
saveStats(final);
return final;
});
}, []);
return [stats, update, loaded];
}

// ═══════════════════════ ADAPTIVE ═══════════════════════
function pickAdaptive(chars,charStats){
if(!chars.length)return null;
const weights=chars.map(ch=>{const s=charStats[ch];if(!s)return 3;const acc=s.c/(s.c+s.w||1);return acc<0.5?5:acc<0.75?3:1;});
const total=weights.reduce((a,b)=>a+b,0);
let r=Math.random()*total;
for(let i=0;i<chars.length;i++){r-=weights[i];if(r<=0)return chars[i];}
return chars[chars.length-1];
}
function recordChar(update,ch,correct){
update(s=>{
const cs={…s.charStats};
if(!cs[ch])cs[ch]={c:0,w:0};
if(correct)cs[ch].c++;else cs[ch].w++;
return{…s,charStats:cs,totalCorrect:s.totalCorrect+(correct?1:0),totalAttempts:s.totalAttempts+1};
});
}

// ═══════════════════════ THEME ═══════════════════════
const C={bg:”#0a0f0a”,bg1:”#111a11”,bg2:”#182018”,bg3:”#1f2b1f”,
bd:”#2a3a2a”,bdH:”#3d5a3d”,
am:”#d4a017”,amD:”#8b6914”,amG:”#d4a01744”,
gn:”#4ade80”,gnD:”#22633a”,rd:”#ef4444”,rdD:”#7f1d1d”,
bl:”#60a5fa”,pu:”#a78bfa”,
tx:”#d4d4c8”,txD:”#6b7a6b”,txM:”#3d4d3d”};
const F=”‘JetBrains Mono’,monospace”;
const Dot=({t})=><span style={{display:“inline-block”,width:t===”.”?8:24,height:8,borderRadius:t===”.”?“50%”:4,background:C.am,margin:“0 2px”,verticalAlign:“middle”}}/>;
const MV=({code})=><div style={{display:“flex”,alignItems:“center”,justifyContent:“center”,gap:1,minHeight:16}}>{(code||””).split(””).map((s,i)=><Dot key={i} t={s}/>)}</div>;

function Btn({children,onClick,active,color,disabled,small,style:sx,…p}){
const c=color||C.am;
return <button onClick={onClick} disabled={disabled} style={{
padding:small?“4px 10px”:“8px 16px”,borderRadius:4,border:`1px solid ${active?c:C.bd}`,
background:active?c+“22”:“transparent”,color:active?c:disabled?C.txM:C.txD,
cursor:disabled?“default”:“pointer”,fontSize:small?10:12,fontWeight:700,fontFamily:F,
letterSpacing:1,textTransform:“uppercase”,transition:“all .15s”,…sx}} {…p}>{children}</button>;
}
const Card=({children,style:sx})=><div style={{background:C.bg2,borderRadius:6,padding:14,border:`1px solid ${C.bd}`,…sx}}>{children}</div>;
const SL=({children})=><div style={{fontSize:10,fontWeight:800,color:C.amD,letterSpacing:3,marginBottom:8,fontFamily:F,textTransform:“uppercase”}}>{children}</div>;
const Score=({c,t})=>t?<div style={{textAlign:“center”,fontSize:12,color:C.txD,fontFamily:F,marginBottom:8}}>{c}/{t} — {Math.round(c/t*100)}%</div>:null;

function TimPanel({t,set}){
const [w,setW]=useState(false);
const [fw,setFw]=useState(false);const [fwEff,setFwEff]=useState(5);
const Sl=({label,k,min,max})=>(
<div style={{marginBottom:6}}>
<div style={{display:“flex”,justifyContent:“space-between”,fontSize:10,color:C.txD,marginBottom:2,fontFamily:F}}><span>{label}</span><span>{Math.round(t[k])}ms</span></div>
<input type=“range” min={min} max={max} step={5} value={t[k]} onChange={e=>{set({…t,[k]:+e.target.value});setW(false);}} style={{width:“100%”,accentColor:C.am}}/>
</div>);
return(<Card style={{marginBottom:12}}>
<SL>Signal Timing</SL>
<div style={{display:“flex”,gap:4,flexWrap:“wrap”,marginBottom:8}}>
{WPM_P.map(v=><Btn key={v} small active={w===v} onClick={()=>{set(wpm2t(v));setW(v);}}>{v} WPM</Btn>)}
</div>
<label style={{display:“flex”,alignItems:“center”,gap:6,marginBottom:8,fontSize:10,color:C.txD,fontFamily:F,cursor:“pointer”}}>
<input type=“checkbox” checked={fw} onChange={e=>{setFw(e.target.checked);if(e.target.checked&&w)set(farnsworth(w,fwEff));}} style={{accentColor:C.am}}/>
Farnsworth spacing
</label>
{fw&&<div style={{marginBottom:8}}>
<div style={{display:“flex”,justifyContent:“space-between”,fontSize:10,color:C.txD,marginBottom:2,fontFamily:F}}><span>Effective WPM</span><span>{fwEff}</span></div>
<input type=“range” min={2} max={w||15} value={fwEff} onChange={e=>{const v=+e.target.value;setFwEff(v);if(w)set(farnsworth(w,v));}} style={{width:“100%”,accentColor:C.am}}/>
</div>}
<Sl label="Dot" k="dot" min={20} max={300}/><Sl label="Dash" k="dash" min={60} max={900}/>
<Sl label="Sym gap" k="symGap" min={20} max={300}/><Sl label="Char gap" k="charGap" min={40} max={1200}/>
<Sl label="Word gap" k="wordGap" min={80} max={2500}/>
<Btn small onClick={()=>{set({…DEF_T});setW(false);}}>Reset</Btn>
</Card>);
}

function NoiseCtrl({noise,setNoise}){
return(<div style={{marginBottom:10}}>
<div style={{display:“flex”,justifyContent:“space-between”,fontSize:10,color:C.txD,marginBottom:2,fontFamily:F}}><span>HF Noise</span><span>{Math.round(noise*100)}%</span></div>
<input type=“range” min={0} max={100} value={noise*100} onChange={e=>setNoise(+e.target.value/100)} style={{width:“100%”,accentColor:C.rd}}/>

  </div>);
}

function CharPick({sel,setSel}){
const toggle=ch=>setSel(p=>p.includes(ch)?p.filter(c=>c!==ch):[…p,ch]);
const toggleCat=cat=>{const ch=CATS[cat];const all=ch.every(c=>sel.includes(c));setSel(p=>all?p.filter(c=>!ch.includes(c)):[…new Set([…p,…ch])]);};
return(<div style={{marginBottom:12}}>
<div style={{display:“flex”,gap:4,flexWrap:“wrap”,marginBottom:8,justifyContent:“center”}}>
{Object.keys(CATS).map(k=>{const all=CATS[k].every(c=>sel.includes(c));return <Btn key={k} small active={all} onClick={()=>toggleCat(k)}>{k}</Btn>;})}
<Btn small color={C.gn} onClick={()=>setSel(Object.values(CATS).flat())}>All</Btn>
<Btn small color={C.rd} onClick={()=>setSel([])}>None</Btn>
</div>
<div style={{display:“flex”,flexWrap:“wrap”,gap:3,justifyContent:“center”}}>
{Object.keys(MORSE).map(ch=>{const s=sel.includes(ch);return(
<button key={ch} onClick={()=>toggle(ch)} style={{width:32,height:32,borderRadius:4,border:“none”,cursor:“pointer”,
background:s?C.am:C.bg3,color:s?”#000”:C.txM,fontWeight:700,fontSize:11,fontFamily:F}}>{ch}</button>);})}
</div>

  </div>);
}

function MorseBtns({onSubmit}){
const [buf,setBuf]=useState(””);
return(<div>
<div style={{background:C.bg1,borderRadius:4,padding:“8px 12px”,marginBottom:8,minHeight:28,display:“flex”,alignItems:“center”,justifyContent:“center”,gap:2,flexWrap:“wrap”,border:`1px solid ${C.bd}`}}>
{buf?buf.split(””).map((s,i)=><Dot key={i} t={s}/>):<span style={{color:C.txM,fontSize:10,fontFamily:F}}>Tap · and — below</span>}
</div>
<div style={{display:“flex”,gap:8,justifyContent:“center”,marginBottom:8}}>
<button onClick={()=>setBuf(b=>b+”.”)} style={{width:56,height:56,borderRadius:“50%”,border:`2px solid ${C.am}`,background:C.bg2,color:C.am,fontSize:24,fontWeight:800,cursor:“pointer”,fontFamily:F}}>·</button>
<button onClick={()=>setBuf(b=>b+”-”)} style={{width:72,height:56,borderRadius:28,border:`2px solid ${C.am}`,background:C.bg2,color:C.am,fontSize:24,fontWeight:800,cursor:“pointer”,fontFamily:F}}>—</button>
</div>
<div style={{display:“flex”,gap:6,justifyContent:“center”}}>
<Btn small onClick={()=>setBuf(””)} color={C.rd}>Clear</Btn>
<Btn small onClick={()=>{if(buf){onSubmit(buf);setBuf(””);}}} color={C.gn}>Submit</Btn>
</div>

  </div>);
}

function MenuBtn({icon,label,desc,onClick,color}){
return <button onClick={onClick} style={{width:“100%”,padding:“14px 16px”,borderRadius:4,border:`1px solid ${C.bd}`,
background:C.bg2,cursor:“pointer”,textAlign:“left”,display:“flex”,alignItems:“center”,gap:12,transition:“border-color .15s”}}
onMouseEnter={e=>e.currentTarget.style.borderColor=color||C.am}
onMouseLeave={e=>e.currentTarget.style.borderColor=C.bd}>
<span style={{fontSize:22,width:36,textAlign:“center”}}>{icon}</span>
<div><div style={{color:C.tx,fontWeight:700,fontSize:13,fontFamily:F,letterSpacing:.5}}>{label}</div>
<div style={{color:C.txD,fontSize:10,marginTop:1,fontFamily:F}}>{desc}</div></div>
</button>;
}

// ═══════════════════════ REFERENCES ═══════════════════════
function RefMorse({timing}){
const [fi,setFi]=useState(“all”);const ac=useRef(null);
const items=fi===“all”?Object.entries(MORSE):Object.entries(MORSE).filter(([k])=>CATS[fi]?.includes(k));
return(<div>
<div style={{display:“flex”,gap:4,flexWrap:“wrap”,marginBottom:12,justifyContent:“center”}}>
{[“all”,…Object.keys(CATS)].map(f=><Btn key={f} small active={fi===f} onClick={()=>setFi(f)}>{f}</Btn>)}
</div>
<div style={{display:“grid”,gridTemplateColumns:“repeat(auto-fill,minmax(100px,1fr))”,gap:6}}>
{items.map(([ch,code])=>(
<button key={ch} onClick={()=>{if(!ac.current)ac.current=new(window.AudioContext||window.webkitAudioContext)();playM(code,ac.current,timing);}}
style={{background:C.bg2,borderRadius:6,padding:“8px 4px”,border:`1px solid ${C.bd}`,display:“flex”,flexDirection:“column”,alignItems:“center”,gap:4,cursor:“pointer”}}>
<span style={{fontSize:18,fontWeight:800,color:C.tx,fontFamily:F}}>{ch}</span><MV code={code}/>
<span style={{fontSize:10,color:C.txD,fontFamily:F,letterSpacing:2}}>{code}</span>
</button>))}
</div>

  </div>);
}
function RefQ(){
  const [q,setQ]=useState("");
  const items=q?Q_CODES.filter(c=>c.code.toLowerCase().includes(q.toLowerCase())||c.a.toLowerCase().includes(q.toLowerCase())):Q_CODES;
  return(<div>
    <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search Q-codes..." style={{width:"100%",padding:"8px 12px",borderRadius:4,border:`1px solid ${C.bd}`,background:C.bg1,color:C.tx,fontSize:13,fontFamily:F,marginBottom:10,outline:"none",boxSizing:"border-box"}}/>
    <div style={{display:"flex",flexDirection:"column",gap:6}}>{items.map(c=>(<Card key={c.code}><span style={{fontSize:16,fontWeight:800,color:C.pu,fontFamily:F}}>{c.code}</span>
      {c.q&&<div style={{fontSize:11,color:C.txD,marginTop:4,fontFamily:F}}>❓ {c.q}</div>}
      <div style={{fontSize:11,color:C.tx,marginTop:2,fontFamily:F}}>→ {c.a}</div></Card>))}</div>
  </div>);
}
function RefPro(){return(<div style={{display:"flex",flexDirection:"column",gap:6}}>{PROSIGNS.map(p=>(<Card key={p.sign} style={{display:"flex",alignItems:"center",gap:12}}>
  <span style={{fontSize:16,fontWeight:800,color:C.am,fontFamily:F,minWidth:40}}>{p.sign}</span>
  <div style={{flex:1}}><div style={{fontSize:11,color:C.tx,fontFamily:F}}>{p.meaning}</div>
    <div style={{fontSize:10,color:C.txD,fontFamily:F,letterSpacing:2,marginTop:2}}>{p.morse}</div></div></Card>))}</div>);}
function RefAbbr(){return(<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}>{CW_ABBR.map(a=>(<Card key={a.a} style={{padding:10}}>
  <span style={{fontSize:14,fontWeight:800,color:C.bl,fontFamily:F}}>{a.a}</span>
  <div style={{fontSize:10,color:C.tx,fontFamily:F,marginTop:2}}>{a.m}</div></Card>))}</div>);}

// ═══════════════════════ BASIC TRAINING ═══════════════════════
function L2M({timing,stats,update}){
const [sel,setSel]=useState([…CATS[“A-Z”],…CATS[“PL”]]);
const [cur,setCur]=useState(null);const [inp,setInp]=useState(””);const [fb,setFb]=useState(null);
const [sc,setSc]=useState({c:0,t:0});const [on,setOn]=useState(false);const [im,setIm]=useState(“type”);
const ac=useRef(null);
const next=useCallback(()=>{const ch=pickAdaptive(sel,stats.charStats);if(ch){setCur(ch);setInp(””);setFb(null);}},[sel,stats.charStats]);
const start=()=>{if(!sel.length)return;if(!ac.current)ac.current=new(window.AudioContext||window.webkitAudioContext)();setOn(true);setSc({c:0,t:0});next();};
const check=(v)=>{const val=v||inp.trim();if(!cur)return;const ok=val===MORSE[cur];setFb(ok);setSc(s=>({c:s.c+(ok?1:0),t:s.t+1}));recordChar(update,cur,ok);};

if(!on)return(<div><SL>Letter → Morse Code</SL>
<p style={{color:C.txD,fontSize:12,fontFamily:F,marginBottom:10}}>Characters you struggle with appear more often (adaptive).</p>
<div style={{display:“flex”,gap:4,marginBottom:10,justifyContent:“center”}}>
<Btn small active={im===“type”} onClick={()=>setIm(“type”)}>Keyboard</Btn>
<Btn small active={im===“buttons”} onClick={()=>setIm(“buttons”)}>·/— Buttons</Btn></div>
<CharPick sel={sel} setSel={setSel}/>
<div style={{textAlign:“center”}}><Btn onClick={start} disabled={!sel.length} color={C.gn}>Begin Drill ({sel.length})</Btn></div></div>);

return(<div style={{textAlign:“center”}}>
<div style={{display:“flex”,justifyContent:“space-between”,marginBottom:12}}>
<Btn small onClick={()=>{setOn(false);setSc({c:0,t:0});}}>← Back</Btn><Score c={sc.c} t={sc.t}/></div>
<Card style={{marginBottom:12,padding:20}}>
<div style={{fontSize:48,fontWeight:800,color:C.tx,fontFamily:F}}>{cur}</div>
<button onClick={()=>{if(cur&&ac.current)playM(MORSE[cur],ac.current,timing);}} style={{marginTop:8,background:“none”,border:`1px solid ${C.bd}`,color:C.txD,borderRadius:4,padding:“4px 12px”,cursor:“pointer”,fontSize:10,fontFamily:F}}>▶ Play</button>
</Card>
{fb!==null&&<div style={{padding:8,borderRadius:4,marginBottom:10,background:fb?C.gnD+“44”:C.rdD+“44”,color:fb?C.gn:C.rd,fontFamily:F,fontSize:12}}>{fb?“Correct!”:`Wrong — ${MORSE[cur]}`}</div>}
{im===“type”?(<div style={{display:“flex”,gap:6,justifyContent:“center”}}>
<input value={inp} onChange={e=>setInp(e.target.value)} onKeyDown={e=>{if(e.key===“Enter”){if(fb!==null)next();else check();}}} placeholder=”· · — ·” autoFocus
style={{flex:1,maxWidth:200,padding:“10px”,borderRadius:4,border:`1px solid ${C.bd}`,background:C.bg1,color:C.tx,fontSize:16,fontFamily:F,textAlign:“center”,outline:“none”}}/>
{fb===null?<Btn onClick={()=>check()} color={C.gn}>Check</Btn>:<Btn onClick={next} color={C.bl}>Next</Btn>}</div>):
(fb===null?<MorseBtns onSubmit={v=>check(v)}/>:<div style={{textAlign:“center”}}><Btn onClick={next} color={C.bl}>Next →</Btn></div>)}

  </div>);
}

function M2L({timing,stats,update}){
const [sel,setSel]=useState([…CATS[“A-Z”],…CATS[“PL”]]);
const [cur,setCur]=useState(null);const [inp,setInp]=useState(””);const [fb,setFb]=useState(null);
const [sc,setSc]=useState({c:0,t:0});const [on,setOn]=useState(false);const ac=useRef(null);
const next=useCallback(()=>{const ch=pickAdaptive(sel,stats.charStats);if(ch){setCur(ch);setInp(””);setFb(null);}},[sel,stats.charStats]);
const start=()=>{if(!sel.length)return;if(!ac.current)ac.current=new(window.AudioContext||window.webkitAudioContext)();setOn(true);setSc({c:0,t:0});next();};
const check=()=>{if(!cur)return;const ok=inp.trim().toUpperCase()===cur;setFb(ok);setSc(s=>({c:s.c+(ok?1:0),t:s.t+1}));recordChar(update,cur,ok);};

if(!on)return(<div><SL>Morse → Letter</SL>
<p style={{color:C.txD,fontSize:12,fontFamily:F,marginBottom:10}}>Adaptive — weak characters appear more often.</p>
<CharPick sel={sel} setSel={setSel}/>
<div style={{textAlign:“center”}}><Btn onClick={start} disabled={!sel.length} color={C.gn}>Begin ({sel.length})</Btn></div></div>);

return(<div style={{textAlign:“center”}}>
<div style={{display:“flex”,justifyContent:“space-between”,marginBottom:12}}><Btn small onClick={()=>{setOn(false);setSc({c:0,t:0});}}>← Back</Btn><Score c={sc.c} t={sc.t}/></div>
<Card style={{marginBottom:12,padding:20}}><MV code={MORSE[cur]||””}/><div style={{fontSize:20,color:C.txD,fontFamily:F,letterSpacing:4,marginTop:8}}>{MORSE[cur]}</div>
<button onClick={()=>{if(cur&&ac.current)playM(MORSE[cur],ac.current,timing);}} style={{marginTop:8,background:“none”,border:`1px solid ${C.bd}`,color:C.txD,borderRadius:4,padding:“4px 12px”,cursor:“pointer”,fontSize:10,fontFamily:F}}>▶ Play</button></Card>
{fb!==null&&<div style={{padding:8,borderRadius:4,marginBottom:10,background:fb?C.gnD+“44”:C.rdD+“44”,color:fb?C.gn:C.rd,fontFamily:F,fontSize:12}}>{fb?“Correct!”:`Wrong — ${cur}`}</div>}
<div style={{display:“flex”,gap:6,justifyContent:“center”}}>
<input value={inp} onChange={e=>setInp(e.target.value)} onKeyDown={e=>{if(e.key===“Enter”){if(fb!==null)next();else check();}}} placeholder=”?” autoFocus
style={{width:80,padding:10,borderRadius:4,border:`1px solid ${C.bd}`,background:C.bg1,color:C.tx,fontSize:22,fontFamily:F,textAlign:“center”,outline:“none”}}/>
{fb===null?<Btn onClick={check} color={C.gn}>Check</Btn>:<Btn onClick={next} color={C.bl}>Next</Btn>}</div>

  </div>);
}

function QQuiz({update}){
const [tab,setTab]=useState(“c2m”);const [idx,setIdx]=useState(0);const [opts,setOpts]=useState([]);const [ch,setCh]=useState(null);
const [sc,setSc]=useState({c:0,t:0});const [sI,setSI]=useState(0);const [sIn,setSIn]=useState(””);const [sFb,setSFb]=useState(null);
const [streak,setStreak]=useState(0);
const mk=useCallback(()=>{const i=Math.floor(Math.random()*Q_CODES.length);const w=Q_CODES.filter((_,j)=>j!==i).sort(()=>Math.random()-.5).slice(0,3);
setIdx(i);setOpts([Q_CODES[i],…w].sort(()=>Math.random()-.5));setCh(null);},[]);
const ns=useCallback(()=>{setSI(Math.floor(Math.random()*Q_SCEN.length));setSIn(””);setSFb(null);},[]);
useEffect(()=>{mk();ns();},[]);
const ckS=()=>{const ok=sIn.trim().toUpperCase().replace(”?”,””)===Q_SCEN[sI].a.toUpperCase().replace(”?”,””);setSFb(ok);setSc(p=>({c:p.c+(ok?1:0),t:p.t+1}));
if(ok)setStreak(s=>{const n=s+1;update(st=>({…st,qcodeStreak:Math.max(st.qcodeStreak,n)}));return n;});else setStreak(0);};

return(<div><SL>Q-Code Training</SL>
<div style={{display:“flex”,gap:4,flexWrap:“wrap”,marginBottom:12,justifyContent:“center”}}>
{[[“c2m”,“Code→Mean”],[” m2c”,“Mean→Code”],[“scn”,“Scenarios”]].map(([id,l])=><Btn key={id} small active={tab===id.trim()} color={C.pu} onClick={()=>{setTab(id.trim());setSc({c:0,t:0});mk();ns();}}>{l}</Btn>)}</div>
<Score c={sc.c} t={sc.t}/>

```
{(tab==="c2m"||tab==="m2c")&&(<div style={{textAlign:"center"}}>
  <Card style={{marginBottom:12,padding:18}}>
    {tab==="c2m"?<div style={{fontSize:32,fontWeight:800,color:C.pu,fontFamily:F}}>{Q_CODES[idx].code}</div>:
    <div><div style={{fontSize:13,color:C.tx,fontFamily:F,lineHeight:1.5}}>{Q_CODES[idx].a}</div>
      {Q_CODES[idx].q&&<div style={{fontSize:11,color:C.txD,fontFamily:F,marginTop:4}}>❓ {Q_CODES[idx].q}</div>}</div>}</Card>
  <div style={{display:tab==="m2c"?"grid":"flex",gridTemplateColumns:"1fr 1fr",flexDirection:"column",gap:6}}>
    {opts.map((o,i)=>{const ok=o.code===Q_CODES[idx].code;const ic=ch===i;const sh=ch!==null;
      let bg=C.bg2,bd=C.bd,cl=C.tx;if(sh&&ok){bg=C.gnD+"44";bd=C.gn;cl=C.gn;}if(sh&&ic&&!ok){bg=C.rdD+"44";bd=C.rd;cl=C.rd;}
      return <button key={i} onClick={()=>{if(ch!==null)return;setCh(i);const c=ok;setSc(s=>({c:s.c+(c?1:0),t:s.t+1}));
        if(c)setStreak(s=>{const n=s+1;update(st=>({...st,qcodeStreak:Math.max(st.qcodeStreak,n)}));return n;});else setStreak(0);}}
        style={{padding:10,borderRadius:4,border:`1px solid ${bd}`,background:bg,color:cl,cursor:ch===null?"pointer":"default",
          fontSize:tab==="m2c"?18:12,fontWeight:tab==="m2c"?800:400,fontFamily:F,textAlign:"left",lineHeight:1.4}}>
        {tab==="c2m"?<><span style={{fontWeight:700,color:C.pu,marginRight:6}}>{o.code}</span>{o.a}</>:o.code}</button>;})}
  </div>
  {ch!==null&&<div style={{marginTop:12}}><Btn onClick={mk} color={C.bl}>Next →</Btn></div>}</div>)}

{tab==="scn"&&(<div style={{textAlign:"center"}}>
  <Card style={{marginBottom:12,padding:18}}>
    <div style={{fontSize:10,fontWeight:800,color:C.amD,letterSpacing:2,marginBottom:6,fontFamily:F}}>SITUATION</div>
    <div style={{fontSize:14,color:C.tx,fontFamily:F,lineHeight:1.6}}>{Q_SCEN[sI].s}</div></Card>
  {sFb!==null&&<div style={{padding:8,borderRadius:4,marginBottom:10,background:sFb?C.gnD+"44":C.rdD+"44",color:sFb?C.gn:C.rd,fontFamily:F,fontSize:12}}>{sFb?"Correct!":`Answer: ${Q_SCEN[sI].a}`}</div>}
  <div style={{display:"flex",gap:6,justifyContent:"center"}}>
    <input value={sIn} onChange={e=>setSIn(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"){if(sFb!==null)ns();else ckS();}}} placeholder="QRL?" autoFocus
      style={{width:140,padding:10,borderRadius:4,border:`1px solid ${C.bd}`,background:C.bg1,color:C.tx,fontSize:18,fontFamily:F,textAlign:"center",outline:"none",letterSpacing:2}}/>
    {sFb===null?<Btn onClick={ckS} color={C.pu}>Check</Btn>:<Btn onClick={ns} color={C.bl}>Next</Btn>}</div></div>)}
```

  </div>);
}

function ProQuiz(){
const [idx,setIdx]=useState(0);const [opts,setOpts]=useState([]);const [ch,setCh]=useState(null);const [sc,setSc]=useState({c:0,t:0});
const mk=useCallback(()=>{const i=Math.floor(Math.random()*PROSIGNS.length);const w=PROSIGNS.filter((_,j)=>j!==i).sort(()=>Math.random()-.5).slice(0,3);
setIdx(i);setOpts([PROSIGNS[i],…w].sort(()=>Math.random()-.5));setCh(null);},[]);
useEffect(()=>{mk();},[]);
return(<div><SL>Prosign Training</SL><Score c={sc.c} t={sc.t}/>
<Card style={{marginBottom:12,padding:18,textAlign:“center”}}><div style={{fontSize:28,fontWeight:800,color:C.am,fontFamily:F}}>{PROSIGNS[idx].sign}</div>
<div style={{fontSize:11,color:C.txD,fontFamily:F,letterSpacing:2,marginTop:4}}>{PROSIGNS[idx].morse}</div></Card>
<div style={{display:“flex”,flexDirection:“column”,gap:6}}>
{opts.map((o,i)=>{const ok=o.sign===PROSIGNS[idx].sign;const ic=ch===i;const sh=ch!==null;
let bg=C.bg2,bd=C.bd,cl=C.tx;if(sh&&ok){bg=C.gnD+“44”;bd=C.gn;cl=C.gn;}if(sh&&ic&&!ok){bg=C.rdD+“44”;bd=C.rd;cl=C.rd;}
return <button key={i} onClick={()=>{if(ch!==null)return;setCh(i);setSc(s=>({c:s.c+(ok?1:0),t:s.t+1}));}}
style={{padding:10,borderRadius:4,border:`1px solid ${bd}`,background:bg,color:cl,cursor:ch===null?“pointer”:“default”,fontSize:12,fontFamily:F,textAlign:“left”}}>
<span style={{fontWeight:700,color:C.am,marginRight:8}}>{o.sign}</span>{o.meaning}</button>;})}
</div>{ch!==null&&<div style={{textAlign:“center”,marginTop:12}}><Btn onClick={mk} color={C.bl}>Next →</Btn></div>}</div>);
}

function AbbrQuiz(){
const [idx,setIdx]=useState(0);const [opts,setOpts]=useState([]);const [ch,setCh]=useState(null);const [sc,setSc]=useState({c:0,t:0});
const mk=useCallback(()=>{const i=Math.floor(Math.random()*CW_ABBR.length);const w=CW_ABBR.filter((_,j)=>j!==i).sort(()=>Math.random()-.5).slice(0,3);
setIdx(i);setOpts([CW_ABBR[i],…w].sort(()=>Math.random()-.5));setCh(null);},[]);
useEffect(()=>{mk();},[]);
return(<div><SL>CW Abbreviations</SL><Score c={sc.c} t={sc.t}/>
<Card style={{marginBottom:12,padding:18,textAlign:“center”}}><div style={{fontSize:28,fontWeight:800,color:C.bl,fontFamily:F}}>{CW_ABBR[idx].a}</div></Card>
<div style={{display:“flex”,flexDirection:“column”,gap:6}}>
{opts.map((o,i)=>{const ok=o.a===CW_ABBR[idx].a;const ic=ch===i;const sh=ch!==null;
let bg=C.bg2,bd=C.bd,cl=C.tx;if(sh&&ok){bg=C.gnD+“44”;bd=C.gn;cl=C.gn;}if(sh&&ic&&!ok){bg=C.rdD+“44”;bd=C.rd;cl=C.rd;}
return <button key={i} onClick={()=>{if(ch!==null)return;setCh(i);setSc(s=>({c:s.c+(ok?1:0),t:s.t+1}));}}
style={{padding:10,borderRadius:4,border:`1px solid ${bd}`,background:bg,color:cl,cursor:ch===null?“pointer”:“default”,fontSize:12,fontFamily:F,textAlign:“left”}}>{o.m}</button>;})}
</div>{ch!==null&&<div style={{textAlign:“center”,marginTop:12}}><Btn onClick={mk} color={C.bl}>Next →</Btn></div>}</div>);
}

// ═══════════════════════ FIELD OPERATIONS ═══════════════════════
function SigRX({timing,stats,update}){
const [sel,setSel]=useState([…CATS[“A-Z”],…CATS[“PL”]]);const [cur,setCur]=useState(null);const [inp,setInp]=useState(””);
const [fb,setFb]=useState(null);const [sc,setSc]=useState({c:0,t:0});const [on,setOn]=useState(false);
const [len,setLen]=useState(1);const [src,setSrc]=useState(“words”);const [playing,setPlaying]=useState(false);
const [showT,setShowT]=useState(false);const [lt,setLt]=useState(timing);const [noise,setNoise]=useState(0);
const ac=useRef(null);useEffect(()=>{setLt(timing);},[timing]);

const pick=useCallback(()=>{
if(len<=1)return pickAdaptive(sel,stats.charStats);
if(src===“words”){let p;if(len<=4)p=PL_WORDS.s;else if(len<=7)p=[…PL_WORDS.s,…PL_WORDS.m];else if(len<=12)p=[…PL_WORDS.m,…PL_WORDS.l];else p=[…PL_WORDS.l,…PL_WORDS.p];return p[Math.floor(Math.random()*p.length)];}
let w=””;for(let i=0;i<len;i++)w+=sel[Math.floor(Math.random()*sel.length)];return w;
},[sel,len,src,stats.charStats]);

const next=useCallback(()=>{const q=pick();if(q){setCur(q);setInp(””);setFb(null);}},[pick]);
const start=()=>{if(len<=1&&!sel.length)return;if(!ac.current)ac.current=new(window.AudioContext||window.webkitAudioContext)();setOn(true);setSc({c:0,t:0});const q=pick();setCur(q);setInp(””);setFb(null);};
const check=()=>{if(!cur)return;const ok=inp.trim().toUpperCase()===cur.toUpperCase();setFb(ok);setSc(s=>({c:s.c+(ok?1:0),t:s.t+1}));
if(len<=1&&cur.length===1)recordChar(update,cur,ok);else update(s=>({…s,totalCorrect:s.totalCorrect+(ok?1:0),totalAttempts:s.totalAttempts+1}));};
const playS=async()=>{if(!cur||!ac.current||playing)return;setPlaying(true);if(cur.length>1)await playW(cur,ac.current,lt,noise);else await playM(MORSE[cur],ac.current,lt,noise);setPlaying(false);};
const isTx=len>1;

if(!on)return(<div><SL>Signal Reception</SL>
<p style={{color:C.txD,fontSize:12,fontFamily:F,marginBottom:10}}>Listen and transcribe. Adaptive difficulty + configurable noise.</p>
<Card style={{marginBottom:10}}>
<div style={{fontSize:11,fontWeight:700,color:C.am,marginBottom:8,fontFamily:F}}>SIGNAL LENGTH</div>
<div style={{display:“flex”,gap:4,flexWrap:“wrap”,marginBottom:8}}>
{[{v:1,l:“Single”},{v:3,l:“Short”},{v:5,l:“Medium”},{v:8,l:“Long”},{v:14,l:“Phrase”}].map(o=><Btn key={o.v} small active={len===o.v} onClick={()=>setLen(o.v)}>{o.l}</Btn>)}</div>
{len>1&&<div style={{display:“flex”,gap:4,marginTop:6}}><Btn small active={src===“words”} color={C.gn} onClick={()=>setSrc(“words”)}>Words</Btn><Btn small active={src===“random”} color={C.gn} onClick={()=>setSrc(“random”)}>Random</Btn></div>}
<div style={{marginTop:10}}><NoiseCtrl noise={noise} setNoise={setNoise}/></div>
</Card>
<Btn small onClick={()=>setShowT(!showT)} style={{display:“block”,margin:“0 auto 10px”}}>⚙ Timing</Btn>
{showT&&<TimPanel t={lt} set={setLt}/>}
{(len<=1||src===“random”)&&<CharPick sel={sel} setSel={setSel}/>}
<div style={{textAlign:“center”}}><Btn onClick={start} disabled={len<=1&&!sel.length} color={C.gn}>Begin</Btn></div></div>);

return(<div style={{textAlign:“center”}}>
<div style={{display:“flex”,justifyContent:“space-between”,marginBottom:12}}><Btn small onClick={()=>{setOn(false);setSc({c:0,t:0});}}>← Back</Btn><Score c={sc.c} t={sc.t}/></div>
<Card style={{marginBottom:12,padding:24}}>
<button onClick={playS} disabled={playing} style={{width:60,height:60,borderRadius:“50%”,border:“none”,cursor:“pointer”,
background:playing?”#444”:`linear-gradient(135deg,${C.am},${C.amD})`,color:”#000”,fontSize:24,display:“flex”,alignItems:“center”,justifyContent:“center”,
margin:“0 auto”,boxShadow:playing?“none”:`0 0 24px ${C.amG}`}}>{playing?”···”:“▶”}</button>
<div style={{color:C.txM,fontSize:10,marginTop:8,fontFamily:F}}>{playing?“TRANSMITTING…”:`RECEIVE${noise>0?" [NOISE "+Math.round(noise*100)+"%]":""}`}</div></Card>
{fb!==null&&<div style={{padding:8,borderRadius:4,marginBottom:10,background:fb?C.gnD+“44”:C.rdD+“44”,color:fb?C.gn:C.rd,fontFamily:F,fontSize:12}}>
{fb?“Correct!”:<div>Wrong — <span style={{letterSpacing:isTx?2:0}}>{cur}</span></div>}</div>}
<div style={{display:“flex”,gap:6,justifyContent:“center”}}>
<input value={inp} onChange={e=>setInp(e.target.value)} onKeyDown={e=>{if(e.key===“Enter”){if(fb!==null)next();else check();}}} placeholder={isTx?“Transcribe…”:“Letter”} autoFocus
style={{flex:1,maxWidth:240,padding:10,borderRadius:4,border:`1px solid ${C.bd}`,background:C.bg1,color:C.tx,fontSize:isTx?14:18,fontFamily:F,textAlign:“center”,outline:“none”,letterSpacing:isTx?2:0}}/>
{fb===null?<Btn onClick={check} color={C.gn}>Check</Btn>:<Btn onClick={next} color={C.bl}>Next</Btn>}</div>

  </div>);
}

function SigTX({timing,stats,update}){
const [sel,setSel]=useState([…CATS[“A-Z”],…CATS[“PL”]]);const [cur,setCur]=useState(null);const [fb,setFb]=useState(null);
const [sc,setSc]=useState({c:0,t:0});const [on,setOn]=useState(false);const [kd,setKd]=useState(false);
const [lt,setLt]=useState(timing);const [showT,setShowT]=useState(false);const [im,setIm]=useState(“key”);
const ks=useRef(0);const gt=useRef(null);const obuf=useRef(””);const wbuf=useRef([]);
const tapped=useRef([]);const [td,setTd]=useState([]);const ac=useRef(null);const osc=useRef(null);
useEffect(()=>{setLt(timing);},[timing]);

const next=useCallback(()=>{const ch=pickAdaptive(sel,stats.charStats);if(ch){setCur(ch);setFb(null);tapped.current=[];obuf.current=””;wbuf.current=[];setTd([]);}},[sel,stats.charStats]);
const start=()=>{if(!sel.length)return;if(!ac.current)ac.current=new(window.AudioContext||window.webkitAudioContext)();setOn(true);setSc({c:0,t:0});next();};
const startT=()=>{if(!ac.current)return;const o=ac.current.createOscillator();const g=ac.current.createGain();o.frequency.value=660;o.type=“sine”;g.gain.value=0.35;o.connect(g).connect(ac.current.destination);o.start();osc.current={o,g};};
const stopT=()=>{if(osc.current){osc.current.o.stop();osc.current=null;}};
const addSym=(s)=>{obuf.current+=s;tapped.current=[…tapped.current,s];setTd([…tapped.current]);
clearTimeout(gt.current);gt.current=setTimeout(()=>{if(obuf.current){wbuf.current.push(obuf.current);tapped.current=[…tapped.current,”|”];setTd([…tapped.current]);obuf.current=””;}},lt.charGap);};
const hDown=()=>{if(kd||fb!==null)return;setKd(true);ks.current=Date.now();clearTimeout(gt.current);startT();};
const hUp=()=>{if(!kd)return;setKd(false);stopT();const d=Date.now()-ks.current;addSym(d<(lt.dot+lt.dash)/2?”.”:”-”);};
const ckAns=()=>{if(obuf.current){wbuf.current.push(obuf.current);obuf.current=””;}if(!cur)return;const ok=(wbuf.current[0]||””)===MORSE[cur];setFb(ok);setSc(s=>({c:s.c+(ok?1:0),t:s.t+1}));recordChar(update,cur,ok);};
const clr=()=>{tapped.current=[];obuf.current=””;wbuf.current=[];setTd([]);setFb(null);};
const decoded=wbuf.current.map(c=>REV[c]||”?”);

if(!on)return(<div><SL>Signal Transmit</SL>
<p style={{color:C.txD,fontSize:12,fontFamily:F,marginBottom:10}}>See a character — key it out. Adaptive drilling.</p>
<div style={{display:“flex”,gap:4,marginBottom:10,justifyContent:“center”}}><Btn small active={im===“key”} color={C.gn} onClick={()=>setIm(“key”)}>Telegraph Key</Btn><Btn small active={im===“buttons”} color={C.gn} onClick={()=>setIm(“buttons”)}>·/— Buttons</Btn></div>
<Btn small onClick={()=>setShowT(!showT)} style={{display:“block”,margin:“0 auto 10px”}}>⚙ Timing</Btn>
{showT&&<TimPanel t={lt} set={setLt}/>}<CharPick sel={sel} setSel={setSel}/>
<div style={{textAlign:“center”}}><Btn onClick={start} disabled={!sel.length} color={C.gn}>Begin</Btn></div></div>);

return(<div style={{textAlign:“center”}}>
<div style={{display:“flex”,justifyContent:“space-between”,marginBottom:12}}><Btn small onClick={()=>{setOn(false);setSc({c:0,t:0});}}>← Back</Btn><Score c={sc.c} t={sc.t}/></div>
<Card style={{marginBottom:10,padding:18}}>
<div style={{fontSize:44,fontWeight:800,color:C.tx,fontFamily:F}}>{cur}</div>
<div style={{fontSize:11,color:C.txM,fontFamily:F,letterSpacing:3,marginTop:4}}>{MORSE[cur]}</div></Card>
<div style={{background:C.bg1,borderRadius:4,padding:“8px 12px”,marginBottom:10,minHeight:24,display:“flex”,alignItems:“center”,justifyContent:“center”,gap:2,flexWrap:“wrap”,border:`1px solid ${C.bd}`}}>
{td.length?td.map((s,i)=>s===”|”?<span key={i} style={{width:8}}/>:<Dot key={i} t={s}/>):<span style={{color:C.txM,fontSize:10,fontFamily:F}}>Waiting…</span>}</div>
{wbuf.current.length>0&&<div style={{marginBottom:10,fontSize:16,fontWeight:700,color:C.bl,fontFamily:F,letterSpacing:3}}>{decoded.join(””)}</div>}
{fb!==null&&<div style={{padding:8,borderRadius:4,marginBottom:10,background:fb?C.gnD+“44”:C.rdD+“44”,color:fb?C.gn:C.rd,fontFamily:F,fontSize:12}}>{fb?“Correct!”:`Wrong — expected ${MORSE[cur]}`}</div>}
{fb===null&&im===“key”&&<div style={{marginBottom:10}}>
<button onMouseDown={hDown} onMouseUp={hUp} onMouseLeave={()=>{if(kd)hUp();}} onTouchStart={e=>{e.preventDefault();hDown();}} onTouchEnd={e=>{e.preventDefault();hUp();}}
style={{width:100,height:100,borderRadius:“50%”,border:`3px solid ${kd?C.am:C.bd}`,
background:kd?`radial-gradient(circle,${C.am},${C.amD})`:`radial-gradient(circle,${C.bg3},${C.bg1})`,
color:kd?”#000”:C.txD,fontSize:12,fontWeight:700,fontFamily:F,cursor:“pointer”,
boxShadow:kd?`0 0 30px ${C.amG}`:“none”,transition:“all .05s”,userSelect:“none”,WebkitUserSelect:“none”}}>{kd?”—”:“KEY”}</button>
<div style={{color:C.txM,fontSize:9,marginTop:6,fontFamily:F}}>HOLD=DASH · TAP=DOT</div></div>}
{fb===null&&im===“buttons”&&<div style={{display:“flex”,gap:8,justifyContent:“center”,marginBottom:10}}>
<button onClick={()=>addSym(”.”)} style={{width:56,height:56,borderRadius:“50%”,border:`2px solid ${C.am}`,background:C.bg2,color:C.am,fontSize:24,fontWeight:800,cursor:“pointer”,fontFamily:F}}>·</button>
<button onClick={()=>addSym(”-”)} style={{width:72,height:56,borderRadius:28,border:`2px solid ${C.am}`,background:C.bg2,color:C.am,fontSize:24,fontWeight:800,cursor:“pointer”,fontFamily:F}}>—</button></div>}
<div style={{display:“flex”,gap:6,justifyContent:“center”}}>
{fb===null?<><Btn small onClick={clr} color={C.rd}>Clear</Btn><Btn onClick={ckAns} color={C.gn}>Check</Btn></>:<Btn onClick={next} color={C.bl}>Next →</Btn>}</div>

  </div>);
}

function NatoExam({timing,update}){
const [ph,setPh]=useState(“setup”);const [sel,setSel]=useState([…CATS[“A-Z”],…CATS[“PL”],…CATS[“0-9”]]);
const [wpm,setWpm]=useState(12);const [gs,setGs]=useState(5);const [gc,setGc]=useState(10);const [maxR,setMaxR]=useState(3);
const [noise,setNoise]=useState(0);
const [grp,setGrp]=useState([]);const [ans,setAns]=useState([]);const [ci,setCi]=useState(0);const [inp,setInp]=useState(””);
const [playing,setPlaying]=useState(false);const [et,setEt]=useState(wpm2t(12));const [res,setRes]=useState(null);const [rl,setRl]=useState(3);const [ap,setAp]=useState(true);
const ac=useRef(null);const ir=useRef(null);

const startE=()=>{if(!sel.length)return;if(!ac.current)ac.current=new(window.AudioContext||window.webkitAudioContext)();
const t=wpm2t(wpm);setEt(t);const g=[];for(let i=0;i<gc;i++){let w=””;for(let j=0;j<gs;j++)w+=sel[Math.floor(Math.random()*sel.length)];g.push(w);}
setGrp(g);setAns(new Array(g.length).fill(””));setCi(0);setInp(””);setPh(“run”);setRes(null);setRl(maxR);};
const playG=async()=>{if(playing)return;setPlaying(true);await playW(grp[ci],ac.current,et,noise);setPlaying(false);if(ir.current)ir.current.focus();};
const replay=async()=>{if(rl<=0||playing)return;setRl(r=>r-1);await playG();};
useEffect(()=>{if(ph===“run”&&ap&&grp.length&&!playing){const t=setTimeout(()=>playG(),500);return()=>clearTimeout(t);}},[ph,ci,grp]);

const submit=()=>{const na=[…ans];na[ci]=inp.toUpperCase().trim();setAns(na);
if(ci<grp.length-1){setCi(ci+1);setInp(””);setRl(maxR);}
else{let chC=0,chT=0;for(let i=0;i<grp.length;i++){const e=grp[i],g=na[i];chT+=e.length;for(let j=0;j<e.length;j++)if(g[j]===e[j])chC++;}
const gC=grp.filter((g,i)=>g===na[i]).length;const pct=Math.round(chC/chT*100);const pass=chC/chT>=.9;
setRes({gC,gT:grp.length,chC,chT,pct,pass});setPh(“review”);
if(pass){update(s=>({…s,natoPassWpm:Math.max(s.natoPassWpm,wpm),natoPassNoise:noise>0&&pass?Math.max(s.natoPassNoise||0,Math.round(noise*100)):s.natoPassNoise||0}));}
}};

if(ph===“setup”)return(<div><SL>NATO Certification Exam</SL>
<Card style={{marginBottom:10}}><div style={{fontSize:11,color:C.txD,fontFamily:F,lineHeight:1.6}}>Pass requires ≥90% character accuracy. Configurable noise simulation.</div></Card>
<Card style={{marginBottom:10}}>
<div style={{display:“flex”,justifyContent:“space-between”,fontSize:11,color:C.txD,fontFamily:F,marginBottom:4}}><span>Speed</span><span>{wpm} WPM</span></div>
<input type=“range” min={3} max={30} value={wpm} onChange={e=>setWpm(+e.target.value)} style={{width:“100%”,accentColor:C.am}}/>
<div style={{display:“flex”,gap:4,flexWrap:“wrap”,marginTop:6}}>{WPM_P.map(w=><Btn key={w} small active={wpm===w} onClick={()=>setWpm(w)}>{w}</Btn>)}</div>
<NoiseCtrl noise={noise} setNoise={setNoise}/>
<div style={{display:“flex”,gap:10,marginTop:6}}>
{[[“Chars”,gs,setGs,1,10],[“Groups”,gc,setGc,3,50],[“Replays”,maxR,setMaxR,0,10]].map(([l,v,s,mn,mx])=>(
<div key={l} style={{flex:1}}><div style={{fontSize:10,color:C.txD,fontFamily:F,marginBottom:2}}>{l}</div>
<input type=“number” min={mn} max={mx} value={v} onChange={e=>s(Math.max(mn,Math.min(mx,+e.target.value)))}
style={{width:“100%”,padding:6,borderRadius:4,border:`1px solid ${C.bd}`,background:C.bg1,color:C.tx,fontSize:14,textAlign:“center”,fontFamily:F,outline:“none”}}/></div>))}
</div>
<label style={{display:“flex”,alignItems:“center”,gap:6,marginTop:8,fontSize:11,color:C.txD,fontFamily:F,cursor:“pointer”}}>
<input type=“checkbox” checked={ap} onChange={e=>setAp(e.target.checked)} style={{accentColor:C.am}}/>Auto-play</label>
</Card>
<CharPick sel={sel} setSel={setSel}/>
<div style={{textAlign:“center”}}><Btn onClick={startE} disabled={!sel.length} color={C.rd}>Begin Exam</Btn></div></div>);

if(ph===“run”)return(<div style={{textAlign:“center”}}>
<div style={{display:“flex”,justifyContent:“space-between”,marginBottom:10}}><Btn small onClick={()=>setPh(“setup”)}>Abort</Btn>
<span style={{color:C.txD,fontSize:12,fontFamily:F}}>{ci+1}/{grp.length}</span></div>
<div style={{height:3,background:C.bg3,borderRadius:2,marginBottom:14,overflow:“hidden”}}><div style={{width:`${(ci/grp.length)*100}%`,height:“100%”,background:C.rd,transition:“width .3s”}}/></div>
<Card style={{marginBottom:12,padding:24}}>
<div style={{display:“flex”,justifyContent:“center”,gap:10}}>
<button onClick={playG} disabled={playing} style={{width:60,height:60,borderRadius:“50%”,border:“none”,cursor:“pointer”,
background:playing?”#444”:`linear-gradient(135deg,${C.rd},${C.rdD})`,color:”#fff”,fontSize:24,display:“flex”,alignItems:“center”,justifyContent:“center”}}>{playing?”···”:“▶”}</button>
{maxR>0&&<button onClick={replay} disabled={rl<=0||playing} style={{width:40,height:40,borderRadius:“50%”,border:`1px solid ${C.bd}`,background:“transparent”,color:rl>0?C.txD:C.txM,fontSize:14,cursor:rl>0?“pointer”:“default”}}>↻</button>}
</div>
<div style={{color:C.txM,fontSize:10,marginTop:8,fontFamily:F}}>{playing?“TX…”:`READY${noise>0?" [NOISE]":""}${maxR>0?` · ${rl} replays`:""}`}</div></Card>
<div style={{display:“flex”,gap:6,justifyContent:“center”}}>
<input ref={ir} value={inp} onChange={e=>setInp(e.target.value)} onKeyDown={e=>{if(e.key===“Enter”)submit();}} placeholder={`${gs} chars`} maxLength={gs+2}
style={{flex:1,maxWidth:200,padding:10,borderRadius:4,border:`1px solid ${C.bd}`,background:C.bg1,color:C.tx,fontSize:18,fontFamily:F,textAlign:“center”,outline:“none”,letterSpacing:4}}/>
<Btn onClick={submit} color={C.rd}>{ci<grp.length-1?“Next”:“Finish”}</Btn></div></div>);

return(<div>
<Card style={{textAlign:“center”,marginBottom:14,padding:18,borderColor:res.pass?C.gn:C.rd}}>
<div style={{fontSize:36,fontWeight:800,color:res.pass?C.gn:C.rd,fontFamily:F}}>{res.pct}%</div>
<div style={{fontSize:14,fontWeight:700,color:res.pass?C.gn:C.rd,fontFamily:F}}>{res.pass?“PASS ✓”:“FAIL ✗”}</div>
<div style={{color:C.txD,fontSize:11,fontFamily:F,marginTop:4}}>{res.chC}/{res.chT} chars · {res.gC}/{res.gT} perfect · {wpm} WPM{noise>0?` · ${Math.round(noise*100)}% noise`:””}</div></Card>
<div style={{display:“flex”,flexDirection:“column”,gap:4,marginBottom:16}}>
{grp.map((g,i)=>{const a=ans[i];return(
<div key={i} style={{display:“flex”,alignItems:“center”,gap:6,background:C.bg2,borderRadius:4,padding:“6px 10px”,border:`1px solid ${g===a?C.gn+"44":C.rd+"44"}`}}>
<span style={{fontSize:10,color:C.txM,fontFamily:F,width:18}}>{i+1}</span>
<span style={{fontFamily:F,fontSize:14,letterSpacing:3,color:C.tx,flex:1}}>{g.split(””).map((ch,j)=><span key={j} style={{color:a[j]===ch?C.gn:C.rd}}>{ch}</span>)}</span>
<span style={{fontFamily:F,fontSize:12,letterSpacing:2,color:g===a?C.gn+“66”:C.rd+“66”}}>{a||”—”}</span></div>);})}
</div>
<div style={{display:“flex”,gap:6,justifyContent:“center”}}><Btn onClick={()=>setPh(“setup”)}>Settings</Btn><Btn onClick={startE} color={C.rd}>Retry</Btn></div></div>);
}

function SpeedLadder({timing,stats,update}){
const [sel,setSel]=useState([…CATS[“A-Z”],…CATS[“PL”]]);const [on,setOn]=useState(false);
const [wpm,setWpm]=useState(5);const [cur,setCur]=useState(null);const [inp,setInp]=useState(””);
const [fb,setFb]=useState(null);const [streak,setStreak]=useState(0);const [playing,setPlaying]=useState(false);
const [noise,setNoise]=useState(0);
const ac=useRef(null);
const next=useCallback(()=>{const ch=pickAdaptive(sel,stats.charStats);if(ch){setCur(ch);setInp(””);setFb(null);}},[sel,stats.charStats]);
const start=()=>{if(!sel.length)return;if(!ac.current)ac.current=new(window.AudioContext||window.webkitAudioContext)();setOn(true);setWpm(5);setStreak(0);next();};
const playS=async()=>{if(!cur||!ac.current||playing)return;setPlaying(true);await playM(MORSE[cur],ac.current,wpm2t(wpm),noise);setPlaying(false);};
useEffect(()=>{if(on&&cur&&ac.current&&!playing){const t=setTimeout(()=>playS(),400);return()=>clearTimeout(t);}},[cur,on]);

const check=()=>{if(!cur)return;const ok=inp.trim().toUpperCase()===cur;setFb(ok);recordChar(update,cur,ok);
if(ok){const ns=streak+1;setStreak(ns);update(s=>({…s,bestLadderStreak:Math.max(s.bestLadderStreak,ns),maxLadderWpm:Math.max(s.maxLadderWpm,wpm)}));
if(ns%3===0)setWpm(w=>{const nw=Math.min(w+1,35);update(s=>({…s,maxLadderWpm:Math.max(s.maxLadderWpm,nw)}));return nw;});}
else setStreak(0);};

if(!on)return(<div><SL>Speed Ladder</SL>
<p style={{color:C.txD,fontSize:12,fontFamily:F,marginBottom:10}}>Starts 5 WPM, increases every 3 correct. Mistake resets streak. Adaptive chars.</p>
{stats.bestLadderStreak>0&&<div style={{textAlign:“center”,marginBottom:10,color:C.am,fontSize:12,fontFamily:F}}>Best streak: {stats.bestLadderStreak} · Max WPM: {stats.maxLadderWpm}</div>}
<NoiseCtrl noise={noise} setNoise={setNoise}/>
<CharPick sel={sel} setSel={setSel}/>
<div style={{textAlign:“center”}}><Btn onClick={start} disabled={!sel.length} color={C.gn}>Start Ladder</Btn></div></div>);

return(<div style={{textAlign:“center”}}>
<div style={{display:“flex”,justifyContent:“space-between”,marginBottom:12}}><Btn small onClick={()=>setOn(false)}>← Back</Btn>
<div style={{fontFamily:F,fontSize:11,color:C.txD}}><span style={{color:C.am,fontWeight:700}}>{wpm} WPM</span> · {streak}x · best {stats.bestLadderStreak}</div></div>
<div style={{height:3,background:C.bg3,borderRadius:2,marginBottom:14,overflow:“hidden”}}><div style={{width:`${((streak%3)/3)*100}%`,height:“100%”,background:C.am,transition:“width .3s”}}/></div>
<Card style={{marginBottom:12,padding:24}}>
<button onClick={playS} disabled={playing} style={{width:60,height:60,borderRadius:“50%”,border:“none”,cursor:“pointer”,
background:playing?”#444”:`linear-gradient(135deg,${C.am},${C.amD})`,color:”#000”,fontSize:24,display:“flex”,alignItems:“center”,justifyContent:“center”,margin:“0 auto”}}>{playing?”···”:“▶”}</button>
<div style={{color:C.txM,fontSize:10,marginTop:8,fontFamily:F}}>{playing?“TX…”:“REPLAY”}</div></Card>
{fb!==null&&<div style={{padding:8,borderRadius:4,marginBottom:10,background:fb?C.gnD+“44”:C.rdD+“44”,color:fb?C.gn:C.rd,fontFamily:F,fontSize:12}}>
{fb?`Correct!${streak%3===0&&streak>0?" ⬆ SPEED UP!":""}`:
<div>Wrong — {cur} ({MORSE[cur]})<br/><span style={{fontSize:11}}>Streak reset.</span></div>}</div>}
<div style={{display:“flex”,gap:6,justifyContent:“center”}}>
<input value={inp} onChange={e=>setInp(e.target.value)} onKeyDown={e=>{if(e.key===“Enter”){if(fb!==null)next();else check();}}} placeholder=”?” autoFocus
style={{width:80,padding:10,borderRadius:4,border:`1px solid ${C.bd}`,background:C.bg1,color:C.tx,fontSize:22,fontFamily:F,textAlign:“center”,outline:“none”}}/>
{fb===null?<Btn onClick={check} color={C.gn}>Check</Btn>:<Btn onClick={next} color={C.bl}>Next</Btn>}</div></div>);
}

function Sprint({timing,stats,update}){
const [sel,setSel]=useState([…CATS[“A-Z”],…CATS[“PL”]]);const [on,setOn]=useState(false);
const [cur,setCur]=useState(null);const [inp,setInp]=useState(””);const [fb,setFb]=useState(null);
const [score,setScore]=useState(0);const [timeLeft,setTimeLeft]=useState(60);const [done,setDone]=useState(false);
const ac=useRef(null);const timer=useRef(null);

const next=useCallback(()=>{const ch=pickAdaptive(sel,stats.charStats);if(ch){setCur(ch);setInp(””);setFb(null);}},[sel,stats.charStats]);
const start=()=>{if(!sel.length)return;if(!ac.current)ac.current=new(window.AudioContext||window.webkitAudioContext)();
setOn(true);setScore(0);setTimeLeft(60);setDone(false);next();
timer.current=setInterval(()=>{setTimeLeft(t=>{if(t<=1){clearInterval(timer.current);setDone(true);return 0;}return t-1;});},1000);};
useEffect(()=>()=>clearInterval(timer.current),[]);

const check=()=>{if(!cur||done)return;const ok=inp.trim().toUpperCase()===cur;setFb(ok);recordChar(update,cur,ok);
if(ok){const ns=score+1;setScore(ns);update(s=>({…s,bestSprint:Math.max(s.bestSprint,ns)}));setTimeout(()=>next(),150);}
else setTimeout(()=>next(),600);};

useEffect(()=>{if(done)update(s=>({…s,bestSprint:Math.max(s.bestSprint,score)}));},[done]);

if(!on)return(<div><SL>60-Second Sprint</SL>
<p style={{color:C.txD,fontSize:12,fontFamily:F,marginBottom:10}}>How many characters can you identify in 60 seconds? Adaptive difficulty.</p>
{stats.bestSprint>0&&<div style={{textAlign:“center”,marginBottom:10,color:C.am,fontSize:12,fontFamily:F}}>Personal best: {stats.bestSprint}</div>}
<CharPick sel={sel} setSel={setSel}/>
<div style={{textAlign:“center”}}><Btn onClick={start} disabled={!sel.length} color={C.rd}>Start Sprint</Btn></div></div>);

if(done)return(<div style={{textAlign:“center”}}>
<Card style={{padding:24,marginBottom:16}}>
<div style={{fontSize:48,fontWeight:800,color:C.am,fontFamily:F}}>{score}</div>
<div style={{fontSize:14,color:C.txD,fontFamily:F}}>correct in 60 seconds</div>
{score>=(stats.bestSprint||0)&&score>0&&<div style={{color:C.gn,fontSize:12,fontFamily:F,marginTop:6}}>🏆 NEW PERSONAL BEST!</div>}
</Card>
<div style={{display:“flex”,gap:6,justifyContent:“center”}}><Btn onClick={()=>setOn(false)}>Back</Btn><Btn onClick={start} color={C.rd}>Retry</Btn></div></div>);

return(<div style={{textAlign:“center”}}>
<div style={{display:“flex”,justifyContent:“space-between”,marginBottom:12}}>
<Btn small onClick={()=>{clearInterval(timer.current);setOn(false);}}>← Abort</Btn>
<div style={{fontFamily:F,fontSize:14,color:timeLeft<=10?C.rd:C.am,fontWeight:700}}>{timeLeft}s · {score}</div></div>
<div style={{height:3,background:C.bg3,borderRadius:2,marginBottom:14,overflow:“hidden”}}><div style={{width:`${(timeLeft/60)*100}%`,height:“100%”,background:timeLeft<=10?C.rd:C.am,transition:“width 1s linear”}}/></div>
<Card style={{marginBottom:12,padding:20}}>
<div style={{fontSize:44,fontWeight:800,color:C.tx,fontFamily:F}}>{cur}</div>
<MV code={MORSE[cur]||””}/></Card>
{fb!==null&&<div style={{padding:6,borderRadius:4,marginBottom:8,background:fb?C.gnD+“44”:C.rdD+“44”,color:fb?C.gn:C.rd,fontFamily:F,fontSize:12}}>{fb?“✓”:“✗ “+cur}</div>}
<input value={inp} onChange={e=>{setInp(e.target.value);}} onKeyDown={e=>{if(e.key===“Enter”)check();}} placeholder=”?” autoFocus
style={{width:80,padding:10,borderRadius:4,border:`1px solid ${C.bd}`,background:C.bg1,color:C.tx,fontSize:22,fontFamily:F,textAlign:“center”,outline:“none”}}/>

  </div>);
}

function CallsignRX({timing,update}){
const [on,setOn]=useState(false);const [cur,setCur]=useState(null);const [inp,setInp]=useState(””);
const [fb,setFb]=useState(null);const [sc,setSc]=useState({c:0,t:0});const [playing,setPlaying]=useState(false);
const [noise,setNoise]=useState(0.2);const [wpm,setWpm]=useState(12);
const ac=useRef(null);

const next=useCallback(()=>{setCur(SP_CALLS[Math.floor(Math.random()*SP_CALLS.length)]);setInp(””);setFb(null);},[]);
const start=()=>{if(!ac.current)ac.current=new(window.AudioContext||window.webkitAudioContext)();setOn(true);setSc({c:0,t:0});next();};
const playS=async()=>{if(!cur||!ac.current||playing)return;setPlaying(true);await playW(cur,ac.current,wpm2t(wpm),noise);setPlaying(false);};
useEffect(()=>{if(on&&cur&&ac.current&&!playing){const t=setTimeout(()=>playS(),500);return()=>clearTimeout(t);}},[cur,on]);
const check=()=>{if(!cur)return;const ok=inp.trim().toUpperCase()===cur;setFb(ok);setSc(s=>({c:s.c+(ok?1:0),t:s.t+1}));
update(s=>({…s,totalCorrect:s.totalCorrect+(ok?1:0),totalAttempts:s.totalAttempts+1}));};

if(!on)return(<div><SL>Callsign Recognition</SL>
<p style={{color:C.txD,fontSize:12,fontFamily:F,marginBottom:10}}>Identify Polish amateur callsigns (SP/SQ prefix) from audio with noise.</p>
<Card style={{marginBottom:10}}>
<div style={{display:“flex”,justifyContent:“space-between”,fontSize:11,color:C.txD,fontFamily:F,marginBottom:4}}><span>Speed</span><span>{wpm} WPM</span></div>
<input type=“range” min={5} max={25} value={wpm} onChange={e=>setWpm(+e.target.value)} style={{width:“100%”,accentColor:C.am}}/>
<NoiseCtrl noise={noise} setNoise={setNoise}/>
</Card>
<div style={{textAlign:“center”}}><Btn onClick={start} color={C.gn}>Begin</Btn></div></div>);

return(<div style={{textAlign:“center”}}>
<div style={{display:“flex”,justifyContent:“space-between”,marginBottom:12}}><Btn small onClick={()=>setOn(false)}>← Back</Btn><Score c={sc.c} t={sc.t}/></div>
<Card style={{marginBottom:12,padding:24}}>
<button onClick={playS} disabled={playing} style={{width:60,height:60,borderRadius:“50%”,border:“none”,cursor:“pointer”,
background:playing?”#444”:`linear-gradient(135deg,${C.am},${C.amD})`,color:”#000”,fontSize:24,display:“flex”,alignItems:“center”,justifyContent:“center”,margin:“0 auto”}}>{playing?”···”:“▶”}</button>
<div style={{color:C.txM,fontSize:10,marginTop:8,fontFamily:F}}>{playing?“TX…”:“CALLSIGN INCOMING”}</div></Card>
{fb!==null&&<div style={{padding:8,borderRadius:4,marginBottom:10,background:fb?C.gnD+“44”:C.rdD+“44”,color:fb?C.gn:C.rd,fontFamily:F,fontSize:12}}>{fb?“Correct!”:`Wrong — ${cur}`}</div>}
<div style={{display:“flex”,gap:6,justifyContent:“center”}}>
<input value={inp} onChange={e=>setInp(e.target.value)} onKeyDown={e=>{if(e.key===“Enter”){if(fb!==null)next();else check();}}} placeholder=“SP1ABC” autoFocus
style={{flex:1,maxWidth:180,padding:10,borderRadius:4,border:`1px solid ${C.bd}`,background:C.bg1,color:C.tx,fontSize:16,fontFamily:F,textAlign:“center”,outline:“none”,letterSpacing:2}}/>
{fb===null?<Btn onClick={check} color={C.gn}>Check</Btn>:<Btn onClick={next} color={C.bl}>Next</Btn>}</div></div>);
}

function PhraseDictation({timing,update}){
const [on,setOn]=useState(false);const [cur,setCur]=useState(null);const [inp,setInp]=useState(””);
const [fb,setFb]=useState(null);const [sc,setSc]=useState({c:0,t:0});const [playing,setPlaying]=useState(false);
const [noise,setNoise]=useState(0);const [wpm,setWpm]=useState(10);
const ac=useRef(null);
const next=useCallback(()=>{setCur(PL_SENTENCES[Math.floor(Math.random()*PL_SENTENCES.length)]);setInp(””);setFb(null);},[]);
const start=()=>{if(!ac.current)ac.current=new(window.AudioContext||window.webkitAudioContext)();setOn(true);setSc({c:0,t:0});next();};
const playS=async()=>{if(!cur||!ac.current||playing)return;setPlaying(true);await playW(cur,ac.current,wpm2t(wpm),noise);setPlaying(false);};
const check=()=>{if(!cur)return;const ok=inp.trim().toUpperCase()===cur;setFb(ok);setSc(s=>({c:s.c+(ok?1:0),t:s.t+1}));
update(s=>({…s,totalCorrect:s.totalCorrect+(ok?1:0),totalAttempts:s.totalAttempts+1}));};

if(!on)return(<div><SL>Phrase Dictation</SL>
<p style={{color:C.txD,fontSize:12,fontFamily:F,marginBottom:10}}>Full Polish military sentences transmitted as morse. Transcribe the entire phrase.</p>
<Card style={{marginBottom:10}}>
<div style={{display:“flex”,justifyContent:“space-between”,fontSize:11,color:C.txD,fontFamily:F,marginBottom:4}}><span>Speed</span><span>{wpm} WPM</span></div>
<input type=“range” min={3} max={20} value={wpm} onChange={e=>setWpm(+e.target.value)} style={{width:“100%”,accentColor:C.am}}/>
<NoiseCtrl noise={noise} setNoise={setNoise}/>
</Card>
<div style={{textAlign:“center”}}><Btn onClick={start} color={C.gn}>Begin</Btn></div></div>);

return(<div style={{textAlign:“center”}}>
<div style={{display:“flex”,justifyContent:“space-between”,marginBottom:12}}><Btn small onClick={()=>setOn(false)}>← Back</Btn><Score c={sc.c} t={sc.t}/></div>
<Card style={{marginBottom:12,padding:24}}>
<button onClick={playS} disabled={playing} style={{width:60,height:60,borderRadius:“50%”,border:“none”,cursor:“pointer”,
background:playing?”#444”:`linear-gradient(135deg,${C.am},${C.amD})`,color:”#000”,fontSize:24,display:“flex”,alignItems:“center”,justifyContent:“center”,margin:“0 auto”}}>{playing?”···”:“▶”}</button>
<div style={{color:C.txM,fontSize:10,marginTop:8,fontFamily:F}}>{playing?“TRANSMITTING PHRASE…”:“FULL PHRASE INCOMING”}</div></Card>
{fb!==null&&<div style={{padding:8,borderRadius:4,marginBottom:10,background:fb?C.gnD+“44”:C.rdD+“44”,color:fb?C.gn:C.rd,fontFamily:F,fontSize:12,lineHeight:1.5}}>
{fb?“Correct!”:<div>Expected:<br/><span style={{letterSpacing:1}}>{cur}</span></div>}</div>}
<div style={{display:“flex”,gap:6,justifyContent:“center”}}>
<input value={inp} onChange={e=>setInp(e.target.value)} onKeyDown={e=>{if(e.key===“Enter”){if(fb!==null)next();else check();}}} placeholder=“Transcribe full phrase…” autoFocus
style={{flex:1,maxWidth:300,padding:10,borderRadius:4,border:`1px solid ${C.bd}`,background:C.bg1,color:C.tx,fontSize:13,fontFamily:F,textAlign:“center”,outline:“none”}}/>
{fb===null?<Btn onClick={check} color={C.gn}>Check</Btn>:<Btn onClick={next} color={C.bl}>Next</Btn>}</div></div>);
}

function SimQSO({timing,update}){
const [on,setOn]=useState(false);const [step,setStep]=useState(0);const [inp,setInp]=useState(””);
const [fb,setFb]=useState(null);const [playing,setPlaying]=useState(false);
const ac=useRef(null);const call=useRef(SP_CALLS[Math.floor(Math.random()*SP_CALLS.length)]);

const start=()=>{if(!ac.current)ac.current=new(window.AudioContext||window.webkitAudioContext)();call.current=SP_CALLS[Math.floor(Math.random()*SP_CALLS.length)];setOn(true);setStep(0);setInp(””);setFb(null);};
const t=QSO_TPL[step];const rx=t?.rx.replace(/{call}/g,call.current)||””;
const playRx=async()=>{if(playing)return;setPlaying(true);await playW(rx,ac.current,timing);setPlaying(false);};
const submit=()=>{setFb(inp.trim().length>=3);};

if(!on)return(<div><SL>Simulated QSO</SL>
<Card style={{marginBottom:10}}><div style={{fontSize:12,color:C.tx,fontFamily:F,lineHeight:1.6}}>Practice a full CW radio contact — callsign exchange, signal report, QTH, and closing with a random station.</div></Card>
<Card style={{marginBottom:10}}><div style={{fontSize:11,fontWeight:700,color:C.am,marginBottom:6,fontFamily:F}}>YOUR CALLSIGN</div>
<div style={{fontSize:20,fontWeight:800,color:C.tx,fontFamily:F}}>SP1YOU</div>
<div style={{fontSize:10,color:C.txD,fontFamily:F,marginTop:4}}>QTH: KRAKÓW · NAME: OPERATOR</div></Card>
<div style={{textAlign:“center”}}><Btn onClick={start} color={C.gn}>Start QSO</Btn></div></div>);

return(<div style={{textAlign:“center”}}>
<div style={{display:“flex”,justifyContent:“space-between”,marginBottom:12}}><Btn small onClick={()=>setOn(false)}>← Back</Btn>
<span style={{fontSize:11,color:C.txD,fontFamily:F}}>Step {step+1}/{QSO_TPL.length}</span></div>
<div style={{height:3,background:C.bg3,borderRadius:2,marginBottom:14,overflow:“hidden”}}><div style={{width:`${(step/QSO_TPL.length)*100}%`,height:“100%”,background:C.gn,transition:“width .3s”}}/></div>
<Card style={{marginBottom:10,textAlign:“left”}}>
<div style={{fontSize:10,fontWeight:800,color:C.rd,letterSpacing:2,marginBottom:6,fontFamily:F}}>INCOMING</div>
<div style={{fontSize:11,color:C.am,fontFamily:F,lineHeight:1.6,letterSpacing:1,wordBreak:“break-all”}}>{rx}</div>
<button onClick={playRx} disabled={playing} style={{marginTop:8,background:“none”,border:`1px solid ${C.bd}`,color:C.txD,borderRadius:4,padding:“4px 12px”,cursor:“pointer”,fontSize:10,fontFamily:F}}>
{playing?“TX…”:“▶ Play”}</button></Card>
<Card style={{marginBottom:10,textAlign:“left”}}>
<div style={{fontSize:10,fontWeight:800,color:C.gn,letterSpacing:2,marginBottom:4,fontFamily:F}}>YOUR RESPONSE</div>
<div style={{fontSize:11,color:C.txD,fontFamily:F}}>💡 {t?.hint.replace(/{call}/g,call.current)}</div></Card>
{fb!==null&&<div style={{padding:8,borderRadius:4,marginBottom:10,background:C.gnD+“44”,color:C.gn,fontFamily:F,fontSize:12}}>
Response logged. {step<QSO_TPL.length-1?“Next exchange.”:“QSO complete! 73 OM”}</div>}
<div style={{display:“flex”,gap:6,justifyContent:“center”}}>
<input value={inp} onChange={e=>setInp(e.target.value)} onKeyDown={e=>{if(e.key===“Enter”){
if(fb!==null){if(step<QSO_TPL.length-1){setStep(step+1);setInp(””);setFb(null);}else{update(s=>({…s,qsoCompleted:(s.qsoCompleted||0)+1}));setOn(false);}}
else submit();}}} placeholder=“Your CW response…” autoFocus
style={{flex:1,maxWidth:280,padding:10,borderRadius:4,border:`1px solid ${C.bd}`,background:C.bg1,color:C.tx,fontSize:12,fontFamily:F,outline:“none”,letterSpacing:1}}/>
{fb===null?<Btn onClick={submit} color={C.gn}>Send</Btn>:
step<QSO_TPL.length-1?<Btn onClick={()=>{setStep(step+1);setInp(””);setFb(null);}} color={C.bl}>Next</Btn>:
<Btn onClick={()=>{update(s=>({…s,qsoCompleted:(s.qsoCompleted||0)+1}));setOn(false);}} color={C.am}>End QSO</Btn>}</div></div>);
}

// ═══════════════════════ ACHIEVEMENTS ═══════════════════════
function Achievements({stats}){
const unlocked=stats.unlockedBadges||[];
const acc=stats.totalAttempts>0?Math.round(stats.totalCorrect/stats.totalAttempts*100):0;
// Find current rank
const ranks=BADGES.filter(b=>unlocked.includes(b.id));
const currentRank=ranks.length>0?ranks[ranks.length-1]:null;

return(<div>
<SL>Service Record</SL>
<Card style={{marginBottom:14,textAlign:“center”}}>
<div style={{fontSize:40}}>{currentRank?.icon||“🔰”}</div>
<div style={{fontSize:16,fontWeight:800,color:C.am,fontFamily:F,marginTop:4}}>{currentRank?.name||“Rekrut”}</div>
<div style={{fontSize:11,color:C.txD,fontFamily:F}}>{currentRank?.nameEn||“Recruit”}</div>
</Card>

```
<Card style={{marginBottom:14}}>
  <SL>Combat Statistics</SL>
  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
    {[["Total Correct",stats.totalCorrect],["Accuracy",acc+"%"],["Max Ladder WPM",stats.maxLadderWpm],["Best Streak",stats.bestLadderStreak],
      ["Sprint Best",stats.bestSprint],["NATO Pass WPM",stats.natoPassWpm||"—"],["QSOs Completed",stats.qsoCompleted||0],["Q-Code Streak",stats.qcodeStreak||0]].map(([l,v])=>(
      <div key={l} style={{textAlign:"center"}}>
        <div style={{fontSize:18,fontWeight:800,color:C.tx,fontFamily:F}}>{v}</div>
        <div style={{fontSize:9,color:C.txD,fontFamily:F}}>{l}</div></div>))}
  </div>
</Card>

{Object.keys(stats.charStats).length>0&&<Card style={{marginBottom:14}}>
  <SL>Weak Characters</SL>
  <div style={{display:"flex",flexWrap:"wrap",gap:4}}>
    {Object.entries(stats.charStats).sort(([,a],[,b])=>(a.c/(a.c+a.w))-(b.c/(b.c+b.w))).slice(0,10).map(([ch,s])=>{
      const pct=Math.round(s.c/(s.c+s.w)*100);
      return <div key={ch} style={{background:C.bg3,borderRadius:4,padding:"4px 8px",textAlign:"center",border:`1px solid ${pct<50?C.rd+"44":pct<75?C.am+"44":C.gn+"44"}`}}>
        <div style={{fontSize:14,fontWeight:800,color:C.tx,fontFamily:F}}>{ch}</div>
        <div style={{fontSize:9,color:pct<50?C.rd:pct<75?C.am:C.gn,fontFamily:F}}>{pct}%</div></div>;})}
  </div>
</Card>}

<SL>Decorations — {unlocked.length}/{BADGES.length}</SL>
<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}>
  {BADGES.map(b=>{const has=unlocked.includes(b.id);return(
    <Card key={b.id} style={{padding:10,opacity:has?1:0.35,borderColor:has?C.am+"66":C.bd}}>
      <div style={{fontSize:24,textAlign:"center"}}>{b.icon}</div>
      <div style={{fontSize:11,fontWeight:800,color:has?C.am:C.txM,fontFamily:F,textAlign:"center",marginTop:4}}>{b.name}</div>
      <div style={{fontSize:9,color:C.txD,fontFamily:F,textAlign:"center"}}>{b.nameEn}</div>
      <div style={{fontSize:9,color:C.txD,fontFamily:F,textAlign:"center",marginTop:2}}>{b.desc}</div>
    </Card>);})}
</div>

<div style={{marginTop:16,textAlign:"center"}}>
  <Btn small color={C.txD} onClick={()=>{const data=JSON.stringify(stats,null,2);const blob=new Blob([data],{type:"application/json"});const url=URL.createObjectURL(blob);
    const a=document.createElement("a");a.href=url;a.download="morsepl-report.json";a.click();}}>Export Report</Btn>
</div>
```

  </div>);
}

// ═══════════════════════ MAIN APP ═══════════════════════
export default function App(){
const [sec,setSec]=useState(“home”);const [sub,setSub]=useState(null);const [sub2,setSub2]=useState(null);
const [timing,setTiming]=useState({…DEF_T});
const [stats,update,loaded]=useStats();

const nav=(s,sb,sb2)=>{setSec(s);setSub(sb||null);setSub2(sb2||null);};
const back=()=>{if(sub2)setSub2(null);else if(sub)setSub(null);else nav(“home”);};

// Badge toast with ref to prevent loops
const [toast, setToast] = useState(null);
const shownRef = useRef(new Set());
useEffect(() => {
if (!loaded) return;
const ub = stats.unlockedBadges || [];
ub.forEach(id => {
if (!shownRef.current.has(id)) {
shownRef.current.add(id);
if (stats.totalAttempts > 0) {
const b = BADGES.find(x => x.id === id);
if (b) { setToast(b); setTimeout(() => setToast(null), 3500); }
}
}
});
}, [stats.unlockedBadges?.length, loaded]);

return(
<div style={{minHeight:“100vh”,background:C.bg,color:C.tx,fontFamily:F}}>
<link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600;700;800&display=swap" rel="stylesheet"/>

```
  {/* Badge toast */}
  {toast&&<div style={{position:"fixed",top:12,left:"50%",transform:"translateX(-50%)",background:C.bg2,border:`2px solid ${C.am}`,
    borderRadius:8,padding:"10px 20px",zIndex:999,textAlign:"center",boxShadow:`0 0 30px ${C.amG}`,animation:"fadeIn .3s"}}>
    <div style={{fontSize:24}}>{toast.icon}</div>
    <div style={{fontSize:12,fontWeight:800,color:C.am,fontFamily:F}}>{toast.name}</div>
    <div style={{fontSize:10,color:C.txD,fontFamily:F}}>{toast.desc}</div></div>}

  <div style={{maxWidth:480,margin:"0 auto",padding:"16px 14px 40px",position:"relative"}}>
    <div style={{textAlign:"center",marginBottom:20,position:"relative"}}>
      {sec!=="home"&&<button onClick={back} style={{position:"absolute",left:0,top:4,background:"none",border:"none",
        color:C.txD,cursor:"pointer",fontSize:11,fontFamily:F,letterSpacing:1}}>◄ {sub2?"BACK":sub?"BACK":"MENU"}</button>}
      <div style={{fontSize:10,letterSpacing:6,color:C.amD,fontWeight:800}}>·· — ·</div>
      <h1 style={{fontSize:20,fontWeight:800,margin:"2px 0 0",letterSpacing:1}}>MORSE<span style={{color:C.am}}>PL</span></h1>
      <div style={{display:"flex",justifyContent:"center",gap:4,marginTop:4}}>
        <div style={{width:40,height:1,background:C.bd}}/><span style={{fontSize:8,color:C.txM,letterSpacing:3}}>MILITARY TRAINER</span><div style={{width:40,height:1,background:C.bd}}/></div>
    </div>

    {sec==="home"&&<div style={{display:"flex",flexDirection:"column",gap:6}}>
      <MenuBtn icon="📖" label="REFERENCES" desc="Morse · Q-codes · Prosigns · Abbreviations" onClick={()=>nav("ref")}/>
      <MenuBtn icon="🎯" label="BASIC TRAINING" desc="Letter ↔ Morse · Q-codes · Prosigns · Abbreviations" onClick={()=>nav("basic")} color={C.gn}/>
      <MenuBtn icon="📡" label="FIELD OPERATIONS" desc="NATO Exam · Signals · QSO · Sprint · Speed Ladder" onClick={()=>nav("apply")} color={C.rd}/>
      <MenuBtn icon="🎖️" label="ACHIEVEMENTS" desc={`${stats.unlockedBadges?.length||0}/${BADGES.length} decorations earned`} onClick={()=>nav("ach")} color={C.am}/>
      <div style={{marginTop:6}}><MenuBtn icon="⚙" label="SIGNAL SETTINGS" desc="Global timing, Farnsworth, WPM" onClick={()=>nav("set")} color={C.txD}/></div>
    </div>}

    {sec==="set"&&!sub&&<div><TimPanel t={timing} set={setTiming}/><p style={{color:C.txM,fontSize:10,textAlign:"center",fontFamily:F}}>Global defaults. Each mode can override.</p></div>}

    {sec==="ref"&&!sub&&<div style={{display:"flex",flexDirection:"column",gap:6}}>
      <SL>Reference Library</SL>
      <MenuBtn icon="·—" label="MORSE CODES" desc="Full Polish alphabet" onClick={()=>setSub("morse")}/>
      <MenuBtn icon="Q" label="Q-CODES" desc="Radio Q-code list" onClick={()=>setSub("q")} color={C.pu}/>
      <MenuBtn icon="⚡" label="PROSIGNS" desc="Procedural signals" onClick={()=>setSub("pro")}/>
      <MenuBtn icon="✂" label="CW ABBREVIATIONS" desc="73, CQ, RST..." onClick={()=>setSub("abbr")} color={C.bl}/>
    </div>}
    {sec==="ref"&&sub==="morse"&&<RefMorse timing={timing}/>}
    {sec==="ref"&&sub==="q"&&<RefQ/>}
    {sec==="ref"&&sub==="pro"&&<RefPro/>}
    {sec==="ref"&&sub==="abbr"&&<RefAbbr/>}

    {sec==="basic"&&!sub&&<div style={{display:"flex",flexDirection:"column",gap:6}}>
      <SL>Basic Training</SL>
      <MenuBtn icon="✏️" label="LETTER → MORSE" desc="Adaptive · Keyboard or buttons" onClick={()=>setSub("l2m")} color={C.gn}/>
      <MenuBtn icon="🔡" label="MORSE → LETTER" desc="Adaptive character recognition" onClick={()=>setSub("m2l")} color={C.gn}/>
      <MenuBtn icon="🔤" label="Q-CODE DRILLS" desc="Quiz · Scenarios" onClick={()=>setSub("qc")} color={C.pu}/>
      <MenuBtn icon="⚡" label="PROSIGN DRILLS" desc="Procedural signal quiz" onClick={()=>setSub("pro")}/>
      <MenuBtn icon="✂" label="ABBREVIATION DRILLS" desc="CW shorthand quiz" onClick={()=>setSub("abbr")} color={C.bl}/>
    </div>}
    {sec==="basic"&&sub==="l2m"&&<L2M timing={timing} stats={stats} update={update}/>}
    {sec==="basic"&&sub==="m2l"&&<M2L timing={timing} stats={stats} update={update}/>}
    {sec==="basic"&&sub==="qc"&&<QQuiz update={update}/>}
    {sec==="basic"&&sub==="pro"&&<ProQuiz/>}
    {sec==="basic"&&sub==="abbr"&&<AbbrQuiz/>}

    {sec==="apply"&&!sub&&<div style={{display:"flex",flexDirection:"column",gap:6}}>
      <SL>Field Operations</SL>
      <MenuBtn icon="🎖️" label="NATO EXAM" desc="Certification test with noise" onClick={()=>setSub("exam")} color={C.rd}/>
      <MenuBtn icon="🔊" label="SIGNAL RECEPTION" desc="Receive transmissions · Noise · Adaptive" onClick={()=>setSub("rx")} color={C.am}/>
      <MenuBtn icon="📡" label="SIGNAL TRANSMIT" desc="Telegraph key or buttons" onClick={()=>setSub("tx")} color={C.gn}/>
      <MenuBtn icon="⏱" label="60-SECOND SPRINT" desc="Max correct in 60s" onClick={()=>setSub("sprint")} color={C.am}/>
      <MenuBtn icon="⚡" label="SPEED LADDER" desc="Progressive WPM challenge" onClick={()=>setSub("ladder")} color={C.am}/>
      <MenuBtn icon="📻" label="SIMULATED QSO" desc="Full radio contact exercise" onClick={()=>setSub("qso")} color={C.bl}/>
      <MenuBtn icon="🔉" label="CALLSIGN RECOGNITION" desc="Identify SP/SQ calls from audio" onClick={()=>setSub("call")} color={C.am}/>
      <MenuBtn icon="📝" label="PHRASE DICTATION" desc="Full sentence transcription" onClick={()=>setSub("phrase")} color={C.am}/>
    </div>}
    {sec==="apply"&&sub==="exam"&&<NatoExam timing={timing} update={update}/>}
    {sec==="apply"&&sub==="rx"&&<SigRX timing={timing} stats={stats} update={update}/>}
    {sec==="apply"&&sub==="tx"&&<SigTX timing={timing} stats={stats} update={update}/>}
    {sec==="apply"&&sub==="sprint"&&<Sprint timing={timing} stats={stats} update={update}/>}
    {sec==="apply"&&sub==="ladder"&&<SpeedLadder timing={timing} stats={stats} update={update}/>}
    {sec==="apply"&&sub==="qso"&&<SimQSO timing={timing} update={update}/>}
    {sec==="apply"&&sub==="call"&&<CallsignRX timing={timing} update={update}/>}
    {sec==="apply"&&sub==="phrase"&&<PhraseDictation timing={timing} update={update}/>}

    {sec==="ach"&&<Achievements stats={stats}/>}
  </div>
</div>
```

);
}
