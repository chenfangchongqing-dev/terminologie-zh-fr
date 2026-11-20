const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const read=file=>fs.readFileSync(path.join(__dirname,"..",file),"utf8");
const records=JSON.parse(read("data/curated-resources.json"));
test("curated records are valid, unique and source-traceable",()=>{
 assert.ok(records.length>=4);
 assert.equal(new Set(records.map(x=>x.id)).size,records.length);
 for(const x of records){
  assert.ok(["term","parallel","news"].includes(x.type));
  assert.ok(["verified","partial","unreviewed"].includes(x.verification));
  for(const key of ["id","title","zh","fr","source","date","url","relation","note","task"])assert.ok(typeof x[key]==="string"&&x[key].trim(),x.id+" missing "+key);
  const u=new URL(x.url);
  assert.equal(u.protocol,"https:");
 }
});
test("unpaired reports never claim full parallel verification",()=>{
 for(const x of records.filter(x=>x.type==="news")){
  assert.notEqual(x.verification,"verified","News item has not been manually paired: "+x.id);
  assert.match(x.relation,/未核验|单篇|实例/);
 }
});
test("original terminology data and regression suite remain present",()=>{
 for(const file of ["terminology.html","js/terminology.js","data/diplomatie.csv","data/titres_et_institutions_par_pays.csv","tests/terminology.test.js"]) assert.ok(read(file).length>0);
});
test("homepage has four accessible search tabs and referenced resources",()=>{
 const html=read("index.html"),js=read("js/integrated-search.js");
 for(const type of ["all","term","parallel","news"])assert.ok(html.includes('data-type="'+type+'"'));
 for(const fragment of ["data/curated-resources.json","Terminology.parseDataset","verification","relation","textContent","noopener noreferrer"])assert.ok(js.includes(fragment),fragment);
});
