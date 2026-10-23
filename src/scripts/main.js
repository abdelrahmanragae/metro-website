
(()=>{const canvas=document.getElementById('scene'),ctx=canvas.getContext('2d'),preview=document.getElementById('preview'),art=document.getElementById('art'),pname=document.getElementById('pname'),overlay=document.getElementById('overlay');let W,H,dpr,logoMask,logoClearanceMask,items=[],hover=null,drag=null,mouse={x:-999,y:-999},gravity=true,frame=0;const projects=[{name:'About Metro',color:'#f1eee9',ink:'#111',label:'METRO',type:'about'},{name:'Hawari',color:'#b55c3b',ink:'#fff',label:'حواري'},{name:'Maqabid',color:'#d8d4c7',ink:'#111',label:'مقابض'},{name:'Whynot',color:'#8fbbcf',ink:'#111',label:'WHY NOT'},{name:'Selected Work',color:'#e5d8a9',ink:'#111',label:'WORK'}];
const logoImg=new Image();logoImg.src='public/logo/metro-logo.svg';
function logoRect(){const scale=Math.min(W/1920*.91,H/680*.69);return {x:(W-1920*scale)/2,y:H*.68-340*scale,w:1920*scale,h:680*scale}}
function drawLogo(c){if(!logoImg.complete)return;const r=logoRect();c.drawImage(logoImg,r.x,r.y,r.w,r.h)}
function size(){const rect=canvas.getBoundingClientRect();W=rect.width;H=rect.height;dpr=Math.min(devicePixelRatio||1,2);canvas.width=W*dpr;canvas.height=H*dpr;ctx.setTransform(dpr,0,0,dpr,0,0);buildMask();reset()}
function buildMask(){
 const off=document.createElement('canvas');off.width=Math.max(1,Math.floor(W));off.height=Math.max(1,Math.floor(H));
 const o=off.getContext('2d',{willReadFrequently:true});drawLogo(o);
 logoMask=o.getImageData(0,0,off.width,off.height).data;
}
logoImg.onload=()=>{if(W)buildMask()};
// Exact original logo silhouette: no inflated collision margin.
function mask(x,y){const ix=x|0,iy=y|0,cw=Math.floor(W),ch=Math.floor(H);if(ix<0||iy<0||ix>=cw||iy>=ch)return false;return !!logoMask&&logoMask[(iy*cw+ix)*4+3]>100}
function reset(){items=projects.map((p,i)=>{let scale=Math.min(1,Math.max(.48,W/1200));let w=Math.max(125,Math.ceil(p.name.length*13.5+52))*scale;return {...p,x:W*(.18+(i%3)*.28)+(Math.random()-.5)*80,y:-90*scale-i*85*scale,w,h:52*scale,vx:(Math.random()-.5)*5,vy:0,angle:(Math.random()-.5)*.8,spin:(Math.random()-.5)*.045,mass:w/110,seed:i,sleep:false,still:0,contactFrames:0,lastStableX:0,lastStableY:0,impactCooldown:0,restFrames:0,logoRestFrames:0,landedOnLogo:false,logoTouched:false,logoTouchAge:0,lastLogoX:0,lastLogoY:0}});hover=null;preview.classList.remove('visible');frame=0}
function wake(p){p.sleep=false;p.still=0;p.contactFrames=0;p.logoContact=false;p.impactCooldown=0;p.restFrames=0;p.logoRestFrames=0;p.landedOnLogo=false;p.logoTouched=false;p.logoTouchAge=0}
function step(){
 frame++;
 for(const p of items){
  if(p===drag || p.sleep)continue;
  if(p.impactCooldown>0)p.impactCooldown--;
  if(gravity)p.vy+=.22;
  p.vx*=.988;p.vy*=.989;p.spin*=.965;
  p.x+=p.vx;p.y+=p.vy;p.angle+=p.spin;
  const r=p.w*.44,bot=p.h*.5;
  if(p.x-r<5){p.x=r+5;p.vx=Math.abs(p.vx)*.32}
  if(p.x+r>W-5){p.x=W-r-5;p.vx=-Math.abs(p.vx)*.32}
  if(p.y+bot>H-18){p.y=H-18-bot;p.vy=-Math.abs(p.vy)*.2;p.vx*=.83;p.spin*=.7}
  // Deterministic logo collision: find the nearest clear position above the contact.
  let touching=false;
  const incomingVy=p.vy;
  for(let attempt=0;attempt<16;attempt++){
   let collision=false;
   const ca=Math.cos(p.angle),sa=Math.sin(p.angle);
   for(const sx of [-.42,-.25,0,.25,.42]){
    for(const sy of [-.43,0,.43]){
     const lx=sx*p.w,ly=sy*p.h;
     if(mask(p.x+lx*ca-ly*sa,p.y+lx*sa+ly*ca)){collision=true;break}
    }
    if(collision)break;
   }
   if(!collision)break;
   touching=true;p.y-=Math.max(1.5,p.h*.045);
  }
  p.logoContact=touching;
  if(touching){p.logoTouched=true;p.logoTouchAge=0;p.lastLogoX=p.x;p.lastLogoY=p.y;}
  else if(p.logoTouched)p.logoTouchAge++;
  
  if(touching){
   // Impact response only on a meaningful landing, never on each contact frame.
   if(incomingVy>1.7 && p.impactCooldown===0 && p.contactFrames===0){
     p.vy=-Math.min(3.4,incomingVy*.27);
     p.spin+=(p.x/W-.5)*.006;
     p.impactCooldown=14;
   }else if(p.vy>0){
     // Zero the inward velocity: prevents gravity/collision correction chatter.
     p.vy=0;
   }
   p.vx*=.965;p.spin*=.94;
  }
 }
 // Resolve capsule overlap without injecting random impulses.
 for(let iter=0;iter<3;iter++){
  for(let i=0;i<items.length;i++)for(let j=i+1;j<items.length;j++){
   const a=items[i],b=items[j],dx=b.x-a.x,dy=b.y-a.y;
   const ox=(a.w+b.w)*.43-Math.abs(dx),oy=(a.h+b.h)*.46-Math.abs(dy);
   if(ox<=0||oy<=0)continue;
   const aFixed=a.sleep||a===drag,bFixed=b.sleep||b===drag;
   if(aFixed&&bFixed)continue;
   const wa=aFixed?0:bFixed?1:.5,wb=bFixed?0:aFixed?1:.5;
   if(ox<oy){
    const s=Math.sign(dx)||1;
    a.x-=s*ox*wa;b.x+=s*ox*wb;
    if(!aFixed)a.vx*=.45;if(!bFixed)b.vx*=.45;
   }else{
    const s=Math.sign(dy)||1;
    a.y-=s*oy*wa;b.y+=s*oy*wb;
    if(!aFixed)a.vy=Math.min(a.vy,0)*.35;
    if(!bFixed)b.vy=Math.max(b.vy,0)*.35;
    // Bodies already at rest should respond when another capsule lands on them.
    if(aFixed&&a!==drag&&Math.abs(b.vy)>2.6)wake(a);
    if(bFixed&&b!==drag&&Math.abs(a.vy)>2.6)wake(b);
   }
  }
 }
 // Latch the first real logo collision. Small intermittent gaps in the
 // pixel mask must not restart the settling timer (the old bug).
 for(const p of items){
  if(p===drag||p.sleep||!p.logoTouched)continue;
  const logoNearby=!!p.logoContact ||
    [-.35,0,.35].some(t=>mask(p.x+t*p.w,p.y+p.h*.5+5));
  // A meaningful bounce can leave the logo briefly; retain contact history.
  if(logoNearby){
    p.logoRestFrames++;
    p.vx*=.91;p.spin*=.88;
    if(p.vy>0&&p.vy<1.1)p.vy=0;
  }else if(p.logoTouchAge>25){
    // If the capsule actually bounced away, let it fall again normally.
    p.logoTouched=false;p.logoRestFrames=0;p.restFrames=0;
    continue;
  }
  // Stop gravity definitively after the bounce/slide has played out.
  // Unlike V11, this does NOT require nine consecutive zero-velocity
  // collision frames, which the discrete SVG mask rarely produces.
  if(p.logoRestFrames>=30 && p.impactCooldown===0){
    p.sleep=true;p.landedOnLogo=true;
    p.vx=p.vy=p.spin=0;
  }
 }

}
function draw(){ctx.clearRect(0,0,W,H);ctx.fillStyle='#fafaf8';ctx.fillRect(0,0,W,H);ctx.fillStyle='#050505';drawLogo(ctx);for(let p of items){ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.angle);ctx.beginPath();ctx.roundRect(-p.w/2,-p.h/2,p.w,p.h,p.h/2);ctx.fillStyle=hover===p?'#111':'#fafaf8';ctx.strokeStyle='#111';ctx.lineWidth=Math.max(1.1,p.h/26);ctx.fill();ctx.stroke();ctx.fillStyle=hover===p?'#fff':'#111';ctx.font=`500 ${Math.min(22.4,Math.max(10.5,22.4*Math.min(1,W/1200)))}px 'Aeonik Pro',Arial`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(p.name,0,1);ctx.restore()}}
function tick(){if(!overlay.classList.contains('show')){step();draw()}requestAnimationFrame(tick)}function point(e){let r=canvas.getBoundingClientRect();return {x:e.clientX-r.left,y:e.clientY-r.top}}function hit(x,y){for(let i=items.length-1;i>=0;i--){let p=items[i],dx=x-p.x,dy=y-p.y,c=Math.cos(-p.angle),s=Math.sin(-p.angle),rx=dx*c-dy*s,ry=dx*s+dy*c;if(Math.abs(rx)<p.w/2&&Math.abs(ry)<p.h/2)return p}return null}
canvas.addEventListener('pointermove',e=>{mouse=point(e);if(drag){wake(drag);let dx=mouse.x-drag.x,dy=mouse.y-drag.y;drag.vx=dx*.23;drag.vy=dy*.23;drag.x=mouse.x;drag.y=mouse.y;drag.spin=dx*.0008}let h=drag||hit(mouse.x,mouse.y);hover=h;canvas.style.cursor=h?'grab':'default';if(h&&!drag){preview.classList.add('visible');preview.classList.toggle('leftside',mouse.x>W*.63);preview.style.left=(mouse.x>W*.63?Math.max(12,mouse.x-16):Math.min(W-420,mouse.x+8))+'px';preview.style.top=Math.max(165,Math.min(H-150,mouse.y))+'px';art.style.background=h.type==='about'?'#f0efea':h.color;art.style.color=h.ink;art.textContent=h.type==='about'?'Metro ↗':h.label;pname.textContent=h.name;preview.querySelector('.preview-label span:last-child').textContent=h.type==='about'?'MEET THE STUDIO ↗':'VIEW PROJECT ↗'}else preview.classList.remove('visible')});canvas.addEventListener('pointerdown',e=>{const m=point(e);drag=hit(m.x,m.y);if(drag){wake(drag);for(const p of items)if(p!==drag&&Math.hypot(p.x-drag.x,p.y-drag.y)<190)wake(p);canvas.setPointerCapture(e.pointerId);drag.downX=m.x;drag.downY=m.y;drag.downTime=Date.now()}});canvas.addEventListener('pointerup',e=>{if(!drag)return;let p=drag,m=point(e),click=Math.hypot(m.x-p.downX,m.y-p.downY)<12&&Date.now()-p.downTime<350;drag=null;for(const q of items)if(q!==p&&Math.hypot(q.x-p.x,q.y-p.y)<170)wake(q);if(click){document.getElementById('detailName').textContent=p.name;document.getElementById('detailDescription').textContent=p.type==='about'?'Metro is an independent creative branding studio based in Cairo, specializing in contemporary Arabic branding. We bring together cultural understanding, strategic thinking, and creative design to build distinctive brands.':'Selected work · Metro Design Studio. This is a prototype case study; final images and project story will be added next.';let hero=document.getElementById('detailHero');hero.style.background=p.color;hero.style.color=p.ink;hero.textContent=p.label;overlay.classList.add('show');preview.classList.remove('visible')}});canvas.addEventListener('pointerleave',()=>{hover=null;preview.classList.remove('visible')});document.getElementById('close').onclick=()=>overlay.classList.remove('show');document.getElementById('replay').onclick=reset;document.getElementById('gravity').onclick=e=>{gravity=!gravity;items.forEach(wake);e.target.textContent='Gravity: '+(gravity?'ON':'OFF')};window.addEventListener('resize',size);size();tick()})();
