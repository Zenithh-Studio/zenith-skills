import { inspection, list, evidence, reference, chunk, main, isMain, read } from './lib.mjs';
import { readFileSync } from 'node:fs';
export function seed(outline) {return {schemaVersion:1,kind:'cast',id:outline.id+'-cast',title:outline.title+' — Cast',characters:list(outline.characters).map(c=>({id:c.id,name:c.name,aliases:[],arc:c.arc,personality:'',appearance:'',imagePrompt:'',voicePrompt:'',evidence:[],inferences:[]}))};}
export function validate(doc,ctx={}) {
  const g=inspection(doc,'cast');if(!doc||typeof doc!=='object')return g.result();
  g.array(doc.characters,'$.characters');g.unique(doc.characters,'$.characters');
  list(doc.characters).forEach((c,i)=>{
    const p=`$.characters[${i}]`;
    for(const k of ['name','arc','personality','appearance','imagePrompt','voicePrompt'])g.string(c[k],p+'.'+k);
    g.array(c.aliases,p+'.aliases',0);g.array(c.inferences,p+'.inferences',0);
    evidence(g,c.evidence,ctx.source,p+'.evidence');
    if(ctx.outline){reference(g,c.id,ctx.outline.characters,p+'.id');const original=list(ctx.outline.characters).find(v=>v.id===c.id);g.check(!original||original.name===c.name,'roster-name',p+'.name','Keep the accepted outline name.');}
  });
  if(ctx.outline)for(const c of list(ctx.outline.characters))reference(g,c.id,doc.characters,'$.characters');else g.skip('outline-roster','Supply --outline to reconcile the accepted roster.');
  if(ctx.source===undefined)g.skip('source-evidence','Supply --source to verify quotations.');
  return g.result();
}
if(isMain(import.meta.url))main({validate,help:'novel-characters: seed <outline.json> [--out cast.json]\nvalidate|checkup|render <cast.json> [--outline outline.json] [--source source.txt] [--out path] [--md]\nchunk <source.txt> [--out chunks.json]',commands:{seed:({file,emit})=>emit(seed(read(file))),chunk:({file,emit})=>emit(chunk(readFileSync(file,'utf8')))}});
