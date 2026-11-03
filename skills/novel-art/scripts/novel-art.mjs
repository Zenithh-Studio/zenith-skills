import { inspection, list, reference, text, main, isMain, read, render, imageLink } from './lib.mjs';
export function seed(outline){return {schemaVersion:1,kind:'art',id:outline.id+'-art',title:outline.title+' — Art',locations:list(outline.locations).map(v=>({id:v.id,name:v.name,anchors:[],variants:[]})),props:list(outline.props).map(v=>({id:v.id,name:v.name,purpose:v.purpose,scale:'',anchors:[],states:[]}))};}
export function validate(doc,ctx={}) {
 const g=inspection(doc,'art');if(!doc||typeof doc!=='object')return g.result();
 for(const kind of ['locations','props']){
  g.array(doc[kind],'$.'+kind,kind==='props'?0:1);g.unique(doc[kind],'$.'+kind);
  list(doc[kind]).forEach((asset,i)=>{
   const p=`$.${kind}[${i}]`;g.string(asset.name,p+'.name');g.array(asset.anchors,p+'.anchors',3);
   list(asset.anchors).forEach((a,j)=>g.string(a,p+`.anchors[${j}]`));
   const states=kind==='props'?'states':'variants';g.array(asset[states],p+'.'+states);g.unique(asset[states],p+'.'+states);
   list(asset[states]).forEach((v,j)=>{g.string(v.prompt,p+`.${states}[${j}].prompt`);if(kind==='props'){g.check(text(asset.scale)&&String(v.prompt).toLowerCase().includes(asset.scale.toLowerCase()),'prop-scale',p+`.${states}[${j}].prompt`,'Include the declared scale in each prop prompt.');g.check(/white background/i.test(v.prompt??''),'prop-background',p+`.${states}[${j}].prompt`,'Specify a white background.');g.check(/no hands/i.test(v.prompt??''),'prop-hands',p+`.${states}[${j}].prompt`,'Exclude hands explicitly.');}else g.check(/no people|empty|unoccupied/i.test(v.prompt??''),'empty-location',p+`.${states}[${j}].prompt`,'Specify an unoccupied location.');});
   if(kind==='props'){g.string(asset.scale,p+'.scale');g.string(asset.purpose,p+'.purpose');}
   if(asset.variantOf){reference(g,asset.variantOf,doc[kind],p+'.variantOf');g.check(asset.variantOf!==asset.id,'variant-cycle',p+'.variantOf','An asset cannot derive from itself.');let current=asset;const seen=new Set();while(current?.variantOf){if(seen.has(current.id)){g.check(false,'variant-cycle',p+'.variantOf','Variant ancestry must be acyclic.');break;}seen.add(current.id);current=list(doc[kind]).find(v=>v.id===current.variantOf);}}
   if(ctx.outline)reference(g,asset.id,ctx.outline[kind],p+'.id');
  });
  if(ctx.outline)for(const item of list(ctx.outline[kind]))reference(g,item.id,doc[kind],'$.'+kind);
 }
 if(!ctx.outline)g.skip('outline-assets','Supply --outline to reconcile location and prop inventories.');
 return g.result();
}
export function renderArt(doc,result,{file,opts}){const images=[];for(const a of [...list(doc.locations),...list(doc.props)])for(const v of [...list(a.variants),...list(a.states)])if(v.image)images.push({src:imageLink(v.image,file,opts.out),label:`${a.name} / ${v.id}`});return render(doc,result,{images});}
if(isMain(import.meta.url))main({validate,render:renderArt,help:'novel-art: seed <outline.json> [--out art.json]\nvalidate|checkup|render <art.json> [--outline outline.json] [--out path] [--md]',commands:{seed:({file,emit})=>emit(seed(read(file)))}});
