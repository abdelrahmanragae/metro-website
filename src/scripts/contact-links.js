(()=>{
 const config=window.METRO_CONFIG||{};
 const nav=document.getElementById('metroHeaderLinks');
 if(!nav||!config.url||!config.anonKey)return;
 function safeHref(link){
  const value=String(link.value||'').trim();
  const raw=String(link.url||'').trim();
  const label=String(link.label||'').toLowerCase();
  const candidate=raw||((label.includes('email')||label.includes('mail'))&&value?'mailto:'+value:(label.includes('phone')||label.includes('tel'))&&value?'tel:'+value:'');
  if(!candidate)return null;
  try{
   if(/^(mailto:|tel:)/i.test(candidate))return candidate;
   const u=new URL(candidate);
   return ['https:','http:'].includes(u.protocol)?u.href:null;
  }catch{return null}
 }
 async function loadLinks(){
  try{
   const res=await fetch(config.url+'/rest/v1/contact_links?select=label,value,url,visible&visible=eq.true&order=created_at.asc',{headers:{apikey:config.anonKey}});
   if(!res.ok)throw new Error('HTTP '+res.status);
   const links=await res.json();
   nav.replaceChildren();
   const contact=document.querySelector('#contactOverlay .contact-links');
   if(contact)contact.replaceChildren();
   for(const link of links){
    const href=safeHref(link);
    if(!href)continue;
    const a=document.createElement('a');
    a.href=href;a.textContent=link.label||link.value||'Link';
    if(href.startsWith('https://')||href.startsWith('http://')){a.target='_blank';a.rel='noopener noreferrer'}
    nav.appendChild(a);
    if(contact){
     const detail=a.cloneNode(false);
     detail.textContent=(link.value||link.label||'Link')+' ↗';
     contact.appendChild(detail);
    }
   }
  }catch(err){console.warn('Metro links could not be loaded',err)}
 }
 loadLinks();
})();