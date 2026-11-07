(function(){
 const cfg=window.METRO_CONFIG;if(!cfg?.url||!cfg?.anonKey)return;
 const root=document.querySelector('#contactOverlay .contact-content');if(!root)return;
 const heading=root.querySelector('h1'),intro=root.querySelector('.contact-intro'),links=root.querySelector('.contact-links');
 async function read(path){const r=await fetch(cfg.url+'/rest/v1/'+path,{headers:{apikey:cfg.anonKey}});if(!r.ok)throw Error('CMS '+r.status);return r.json()}
 Promise.all([read('pages?slug=eq.contact&select=title,intro,sections'),read('contact_links?visible=eq.true&select=label,value,url&order=created_at.asc')]).then(([pages,contacts])=>{
  const page=pages[0];if(page){
   if(page.intro?.trim())intro.textContent=page.intro;
   for(const b of (Array.isArray(page.sections)?page.sections:[])){
    if(!b?.content?.trim())continue;
    if(b.type==='contact-heading'){heading.textContent=b.content;heading.style.whiteSpace='pre-line'}
    if(b.type==='contact-description')intro.textContent=b.content;
   }
  }
  if(contacts?.length){
   const fragment=document.createDocumentFragment();
   for(const c of contacts){
    const label=String(c.value||c.label||'').trim();let url=String(c.url||'').trim();
    if(!url&&label.includes('@'))url='mailto:'+label;
    if(!/^(https?:\/\/|mailto:|tel:)/i.test(url))continue;
    const a=document.createElement('a');a.href=url;a.textContent=label+' ↗';
    if(/^https?:\/\//i.test(url)){a.target='_blank';a.rel='noopener noreferrer'}
    fragment.append(a);
   }
   if(fragment.childNodes.length)links.replaceChildren(fragment);
  }
 }).catch(e=>console.warn('Contact overlay CMS fallback:',e));
})();
