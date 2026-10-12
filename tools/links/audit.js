const fs=require('fs');const path=require('path');
const core=require(path.resolve(__dirname,'../../src/core.js'));
const dir=process.argv[2]||'.';
const texts=core.VOLUMES.map(v=>fs.readFileSync(path.join(dir,v.file),'utf8'));
const w=core.buildWiki(texts);
const cats={};for(const [c,l] of w.categories) cats[c]=l.length;
const red={};let redN=0;
for(const a of w.articles) for(const t of a.links){ if(t.startsWith('wp:'))continue; if(!core.resolve(w,t)){red[t]=(red[t]||[]);red[t].push(a.title);redN++;}}
const orph=w.articles.filter(a=>!w.backlinks.has(a.slug)).map(a=>a.title);
const self=w.articles.filter(a=>[...a.links].some(t=>{const r=core.resolve(w,t);return r&&r.slug===a.slug})).map(a=>a.title);
console.log(JSON.stringify({n:w.articles.length,warnings:w.warnings,cats,redTargets:Object.keys(red).length,redN,red,orphans:orph.length,orph,self},null,1));
