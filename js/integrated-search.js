(function(){
"use strict";
const DATA_VERSION="20261120-1";
const files=[
{path:"data/diplomatie.csv",source:"diplomatie",label:"外交术语"},
{path:"data/titres_et_institutions_par_pays.csv",source:"institutions_comparees",label:"各国机构与职衔"}
];
const $=id=>document.getElementById(id);
const state={curated:[],terms:[],type:"all",failures:[]};
const norm=v=>Terminology.normalizeSearch(v||"");
const mk=(tag,cls,text)=>{const el=document.createElement(tag);if(cls)el.className=cls;if(text!==undefined)el.textContent=String(text);return el;};
const publicLink=url=>{try{const parsed=new URL(url);return ["http:","https:"].includes(parsed.protocol)?parsed.href:null;}catch{return null;}};
async function load(){
 const requests=[...files.map(async file=>{
 const response=await fetch(file.path+"?v="+DATA_VERSION,{cache:"no-cache"});
 if(!response.ok)throw Error(file.path+": "+response.status);
 return Terminology.parseDataset(await response.text(),file.source).map((item,index)=>({
 id:file.source+"-"+index,type:"term",title:item.chinois,zh:item.chinois,fr:item.francais,
 source:file.label+(item.reference?" · "+item.reference:""),date:item.date||"",
 url:"",relation:"词条对应（旧库）",verification:"unreviewed",
 note:[item.pays,item.definition,item.note].filter(Boolean).join(" · "),
 task:"比较正式机构名称、国家制度与法语规范表达。",category:item.categorie||""}));
 }), (async()=>{const r=await fetch("data/curated-resources.json?v="+DATA_VERSION,{cache:"no-cache"});if(!r.ok)throw Error("精选资源: "+r.status);const raw=await r.json();if(!Array.isArray(raw))throw Error("精选资源格式异常");return raw.filter(item=>item&&["term","parallel","news"].includes(item.type)&&typeof item.title==="string"&&typeof item.zh==="string"&&typeof item.fr==="string").map(item=>({...item,id:String(item.id||""),category:""}));})()];
 const results=await Promise.allSettled(requests);
 results.forEach((result,index)=>{if(result.status==="rejected"){state.failures.push(index<files.length?files[index].label:"精选资源");console.error(result.reason);}
 else if(index<files.length)state.terms.push(...result.value);else state.curated=result.value;});
 render();
}
function matches(item,query,lang){
 if(!query)return false;
 const fields=lang==="zh"?[item.zh]:lang==="fr"?[item.fr]:[item.zh,item.fr,item.title,item.note,item.source,item.category];
 return query.split(/\s+/).every(term=>fields.some(value=>norm(value).includes(term)));
}
function filtered(){
 const query=norm($("query").value),lang=$("lang").value;
 const all=[...state.curated,...state.terms];
 const list=all.filter(x=>(state.type==="all"||x.type===state.type)&&matches(x,query,lang));
 return list.sort((a,b)=>Number(b.type==="term"&&b.verification==="verified")-Number(a.type==="term"&&a.verification==="verified")||Number(b.verification==="verified")-Number(a.verification==="verified")||Number(a.verification==="unreviewed")-Number(b.verification==="unreviewed")||a.title.localeCompare(b.title,"zh"));
}
function textRow(node,label,value){
 const p=mk("p");p.append(mk("strong","",label),document.createTextNode(" "+(value||"—")));node.append(p);
}
function renderCard(item){
 const card=mk("article","result");
 const top=mk("div","row");
 top.append(mk("span","kind",({term:"术语 · Terminologie",parallel:"对照语料 · Corpus parallèle",news:"新闻 · Presse"})[item.type]));
 const chips=mk("div","chips");
 const good=item.verification==="verified";
 chips.append(mk("span","chip "+(good?"ok":item.verification==="partial"?"pending":""),good?"✓ 已核验":item.verification==="partial"?"◌ 部分核验":"○ 未逐项复核"));
 top.append(chips);card.append(top);
 card.append(mk("h3","",item.title));
 const pair=mk("div","pair");
 [["中文",item.zh,"zh"],["Français",item.fr,"fr"]].forEach(([label,value,lang])=>{const col=mk("div"),heading=mk("div","label",label),p=mk("p","",value||"—");p.lang=lang;col.append(heading,p);pair.append(col);});card.append(pair);
 const meta=mk("div","metadata");
 textRow(meta,"来源：",item.source);
 textRow(meta,"发布日期：",item.date);
 textRow(meta,"对应关系：",item.relation);
 textRow(meta,"核验说明：",item.note);
 textRow(meta,"教学使用：",item.task);
 card.append(meta);
 const bottom=mk("div","links");
 if(publicLink(item.url)){const link=mk("a","", "查看原始出处 ↗");link.href=publicLink(item.url);link.target="_blank";link.rel="noopener noreferrer";bottom.append(link);}
 const copy=mk("button","tab","复制法语");copy.type="button";copy.addEventListener("click",async()=>{try{await navigator.clipboard.writeText(item.fr);copy.textContent="已复制";}catch{copy.textContent="复制失败，请手动选择文字";}});bottom.append(copy);
 card.append(bottom);return card;
}
function render(){
 const root=$("results");root.replaceChildren();
 const q=$("query").value.trim();
 const allCount=state.curated.length+state.terms.length;
 const f=state.failures.length?"；部分数据无法加载："+state.failures.join("、"):"";
 if(!q){root.append(mk("div","empty","输入关键词或点击上方示例开始检索。"));$("status").textContent="已加载 "+allCount+" 条资源"+f;return;}
 const hits=filtered();
 $("status").textContent="找到 "+hits.length+" 条结果 / 已加载 "+allCount+" 条"+f;
 if(!hits.length){root.append(mk("div","empty","没有匹配结果。请尝试缩短关键词、切换语言或资源类型。"));return;}
 const fragment=document.createDocumentFragment();
 hits.slice(0,80).forEach(item=>fragment.append(renderCard(item)));root.append(fragment);
 if(hits.length>80)root.append(mk("p","note","结果较多：仅显示前80条，请进一步缩小检索范围。"));
 const task=hits.find(x=>x.type!=="term")||hits[0];
 $("task").textContent="教学任务："+task.task+" 请记录原文链接、对应类型、核验状态，并说明自己的编译选择。";
}
document.querySelectorAll(".tab[data-type]").forEach(button=>button.addEventListener("click",()=>{state.type=button.dataset.type;document.querySelectorAll(".tab[data-type]").forEach(x=>x.setAttribute("aria-selected",String(x===button)));render();}));
$("query").addEventListener("input",render);
$("lang").addEventListener("change",render);
$("reset").addEventListener("click",()=>{$("query").value="";$("lang").value="both";state.type="all";document.querySelectorAll(".tab[data-type]").forEach(x=>x.setAttribute("aria-selected",String(x.dataset.type==="all")));$("task").textContent="检索“新质生产力”，查看各类资源的教学使用建议。";render();$("query").focus();});
document.querySelectorAll(".example").forEach(b=>b.addEventListener("click",()=>{$("query").value=b.dataset.query;render();}));
$("copyTask").addEventListener("click",async()=>{try{await navigator.clipboard.writeText($("task").textContent);$("copyStatus").textContent="课堂任务已复制。";}catch{$("copyStatus").textContent="复制失败，请手动选择文本。";}});
const q=new URLSearchParams(location.search).get("q");if(q)$("query").value=q;
load();
})();