// Shared chat: pretty message pop-ups + an optional compact chat panel that never hides the game.
import {collection,query,orderBy,limit,onSnapshot,addDoc,serverTimestamp} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
const CSS=`
.shz-pops{position:fixed;top:calc(8px + env(safe-area-inset-top));left:0;right:0;display:flex;flex-direction:column;align-items:center;gap:8px;z-index:9000;pointer-events:none}
.shz-pop{pointer-events:auto;width:min(92vw,380px);display:flex;gap:12px;align-items:center;padding:12px 14px;border-radius:18px;position:relative;overflow:hidden;cursor:pointer;text-align:left;color:#F8EAF0;font:15px/1.3 system-ui,-apple-system,'Segoe UI',sans-serif;background:linear-gradient(135deg,rgba(52,30,52,.97),rgba(30,20,32,.97));border:1px solid rgba(232,121,165,.5);box-shadow:0 12px 32px rgba(0,0,0,.55),0 0 24px rgba(232,121,165,.28);animation:shzIn .55s cubic-bezier(.2,1.3,.4,1) both;backdrop-filter:blur(8px)}
.shz-pop.out{animation:shzOut .3s ease-in forwards}
.shz-av{flex:none;width:44px;height:44px;border-radius:50%;display:grid;place-items:center;font-weight:700;font-size:19px;color:#fff;background:linear-gradient(135deg,#E879A5,#9B3A6B);box-shadow:0 0 0 2px rgba(255,255,255,.18),0 0 14px rgba(232,121,165,.5);animation:shzPulse 1.4s ease-in-out 2}
.shz-tx{min-width:0;flex:1}.shz-nm{font-size:11px;letter-spacing:.6px;text-transform:uppercase;color:#E879A5;font-weight:700}.shz-nm b{color:#fff;text-transform:none;letter-spacing:0;font-size:13px}
.shz-mg{margin-top:2px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;word-break:break-word}
.shz-bar{position:absolute;left:0;bottom:0;height:3px;background:linear-gradient(90deg,#E879A5,#ffd1e3);animation:shzBar 5s linear forwards}
@keyframes shzIn{from{transform:translateY(-140%) scale(.9);opacity:0}to{transform:none;opacity:1}}
@keyframes shzOut{to{transform:translateY(-140%);opacity:0}}@keyframes shzBar{from{width:100%}to{width:0}}
@keyframes shzPulse{50%{transform:scale(1.12)}}
.shz-fab{position:fixed;right:14px;bottom:calc(14px + env(safe-area-inset-bottom));width:54px;height:54px;border-radius:50%;border:0;font-size:24px;color:#fff;cursor:pointer;z-index:8500;background:linear-gradient(135deg,#E879A5,#9B3A6B);box-shadow:0 8px 22px rgba(0,0,0,.5),0 0 18px rgba(232,121,165,.45);transition:transform .25s}
.shz-fab:active{transform:scale(.9)}.shz-fab.hide{transform:scale(0);pointer-events:none}
.shz-bd{position:absolute;top:-4px;right:-4px;min-width:22px;height:22px;border-radius:11px;background:#fff;color:#9B3A6B;font:700 12px/22px system-ui;padding:0 5px;box-shadow:0 2px 8px rgba(0,0,0,.4)}.shz-bd:empty{display:none}
.shz-fab.ring{animation:shzRing .6s}@keyframes shzRing{25%{transform:rotate(-14deg)}75%{transform:rotate(14deg)}}
.shz-panel{position:fixed;left:0;right:0;margin:0 auto;bottom:calc(8px + env(safe-area-inset-bottom));width:calc(100% - 16px);max-width:520px;height:196px;z-index:8600;display:flex;flex-direction:column;border-radius:20px;overflow:hidden;color:#F8EAF0;font:14px system-ui,-apple-system,'Segoe UI',sans-serif;background:rgba(25,17,28,.96);border:1px solid rgba(232,121,165,.4);box-shadow:0 -6px 30px rgba(0,0,0,.55);backdrop-filter:blur(10px);transform:translateY(130%);opacity:0;transition:transform .35s cubic-bezier(.2,1,.3,1),opacity .25s;pointer-events:none}
.shz-panel.open{transform:none;opacity:1;pointer-events:auto}
.shz-panel header{display:flex;align-items:center;gap:8px;padding:8px 12px;background:rgba(232,121,165,.12);font-weight:600}.shz-panel header span{flex:1}
.shz-x{background:none;border:0;color:#F8EAF0;font-size:18px;min-width:36px;min-height:32px;cursor:pointer}
.shz-list{flex:1;overflow-y:auto;padding:8px 10px;display:flex;flex-direction:column;gap:5px;overscroll-behavior:contain}
.shz-m{max-width:82%;padding:6px 11px;border-radius:14px;word-break:break-word;animation:shzM .25s ease-out}.shz-m small{display:block;opacity:.6;font-size:10px;margin-top:1px}
.shz-m.me{align-self:flex-end;background:#C2477E;border-bottom-right-radius:4px}.shz-m.them{align-self:flex-start;background:#2c2030;border-bottom-left-radius:4px}
@keyframes shzM{from{transform:translateY(8px) scale(.96);opacity:0}}
.shz-empty{margin:auto;opacity:.55}
.shz-form{display:flex;gap:6px;padding:6px 8px;border-top:1px solid rgba(232,121,165,.2)}
.shz-form input{flex:1;min-width:0;background:#19111C;color:#F8EAF0;border:1px solid rgba(232,121,165,.3);border-radius:20px;padding:9px 14px;font:16px system-ui;outline:none}.shz-form input:focus{border-color:#E879A5}
.shz-form button{border:0;border-radius:50%;width:42px;height:42px;background:#C2477E;color:#fff;font-size:17px;cursor:pointer}
:root{--chat-h:0px}
@media (prefers-reduced-motion:reduce){.shz-pop,.shz-av,.shz-m,.shz-fab{animation:none!important}}`;
let cssDone=false,actx=null;
function blip(){try{actx=actx||new (window.AudioContext||window.webkitAudioContext)();const o=actx.createOscillator(),g=actx.createGain();o.type='sine';o.frequency.setValueAtTime(880,actx.currentTime);o.frequency.exponentialRampToValueAtTime(1320,actx.currentTime+.12);g.gain.setValueAtTime(.08,actx.currentTime);g.gain.exponentialRampToValueAtTime(.001,actx.currentTime+.25);o.connect(g).connect(actx.destination);o.start();o.stop(actx.currentTime+.26);}catch(e){}try{navigator.vibrate&&navigator.vibrate(25);}catch(e){}}
const el=(t,c,x)=>{const e=document.createElement(t);if(c)e.className=c;if(x!=null)e.textContent=x;return e;};
const hm=m=>{const t=m.time&&m.time.toDate?m.time.toDate():new Date();return t.getHours().toString().padStart(2,'0')+':'+t.getMinutes().toString().padStart(2,'0');};
export function initChat(o){
  const {db,roomId,me,partner,widget=true}=o;
  if(!cssDone){const s=document.createElement('style');s.textContent=CSS;document.head.appendChild(s);cssDone=true;}
  const pops=el('div','shz-pops');pops.setAttribute('aria-live','polite');document.body.appendChild(pops);
  let isOpen=false,unread=0,first=true,fab,panel,list,input,badge;
  const col=collection(db,'rooms',roomId,'messages');
  function dismiss(p){if(p.dead)return;p.dead=1;p.classList.add('out');setTimeout(()=>p.remove(),320);}
  function popup(m){
    const p=el('div','shz-pop');p.setAttribute('role','status');
    const av=el('div','shz-av',(m.user||'?')[0].toUpperCase()),tx=el('div','shz-tx'),nm=el('div','shz-nm');
    nm.append('💬 New message from ');nm.append(Object.assign(el('b'),{textContent:m.user}));
    tx.append(nm,el('div','shz-mg',m.text));p.append(av,tx,el('div','shz-bar'));pops.appendChild(p);
    while(pops.children.length>3)dismiss(pops.firstChild);
    const t=setTimeout(()=>dismiss(p),5000);let y0=0;
    p.addEventListener('pointerdown',e=>{y0=e.clientY;});
    p.addEventListener('pointerup',e=>{clearTimeout(t);if(y0-e.clientY>25){dismiss(p);return;}dismiss(p);if(o.onPopupClick)o.onPopupClick(m);else if(widget)openPanel();});
    blip();if(fab&&!isOpen){fab.classList.remove('ring');void fab.offsetWidth;fab.classList.add('ring');}
  }
  function fit(){if(!panel)return;const v=window.visualViewport;panel.style.bottom=(v?Math.max(0,innerHeight-v.height-v.offsetTop):0)+8+'px';}
  function renderList(msgs){
    const near=list.scrollHeight-list.scrollTop-list.clientHeight<60||!list.children.length;list.textContent='';
    if(!msgs.length)list.appendChild(el('div','shz-empty','Say hi 💕'));
    msgs.forEach(m=>{const d=el('div','shz-m '+(m.user===me?'me':'them'),m.text);d.appendChild(el('small','',hm(m)));list.appendChild(d);});
    if(near||isOpen)list.scrollTop=list.scrollHeight;
  }
  function setBadge(){if(badge)badge.textContent=unread?String(unread):'';}
  function openPanel(){if(!panel)return;isOpen=true;unread=0;setBadge();panel.classList.add('open');fab.classList.add('hide');document.documentElement.style.setProperty('--chat-h','212px');document.body.classList.add('shz-open');fit();list.scrollTop=list.scrollHeight;setTimeout(()=>input.focus({preventScroll:true}),250);}
  function closePanel(){if(!panel)return;isOpen=false;panel.classList.remove('open');fab.classList.remove('hide');document.documentElement.style.setProperty('--chat-h','0px');document.body.classList.remove('shz-open');input.blur();}
  if(widget){
    fab=el('button','shz-fab','💬');fab.setAttribute('aria-label','Open chat');badge=el('span','shz-bd');fab.appendChild(badge);
    panel=el('section','shz-panel');panel.setAttribute('aria-label','Chat');
    const h=el('header'),x=el('button','shz-x','✕');x.setAttribute('aria-label','Close chat');h.append(el('span','',`💕 ${partner}`),x);
    list=el('div','shz-list');const f=el('form','shz-form');input=el('input');input.maxLength=500;input.placeholder='Message…';input.setAttribute('aria-label','Message');input.autocomplete='off';
    const sb=el('button','','➤');sb.type='submit';sb.setAttribute('aria-label','Send');f.append(input,sb);panel.append(h,list,f);document.body.append(fab,panel);
    fab.onclick=openPanel;x.onclick=closePanel;
    f.onsubmit=e=>{e.preventDefault();const text=input.value.trim();if(!text)return;input.value='';addDoc(col,{user:me,text,time:serverTimestamp()}).catch(()=>{input.value=text;});input.focus({preventScroll:true});};
    if(window.visualViewport)window.visualViewport.addEventListener('resize',fit);
  }
  const unsub=onSnapshot(query(col,orderBy('time','desc'),limit(50)),snap=>{
    const msgs=[];snap.forEach(d=>msgs.push(d.data({serverTimestamps:'estimate'})));msgs.reverse();
    const added=first?[]:snap.docChanges().filter(c=>c.type==='added').map(c=>c.doc.data({serverTimestamps:'estimate'}));first=false;
    if(widget)renderList(msgs);
    added.forEach(m=>{if(m.user===me)return;if(o.onIncoming)o.onIncoming(m);if(isOpen)return;if(o.shouldPopup&&!o.shouldPopup(m))return;if(widget){unread++;setBadge();}popup(m);});
  },()=>{});
  return {open:openPanel,close:closePanel,destroy(){unsub();pops.remove();if(fab){fab.remove();panel.remove();}document.documentElement.style.setProperty('--chat-h','0px');document.body.classList.remove('shz-open');}};
}
