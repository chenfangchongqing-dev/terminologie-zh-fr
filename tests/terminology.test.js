const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { parseCSV, parseDataset, filterEntries } = require('../js/terminology.js');
const read = name => fs.readFileSync(path.join(__dirname, '..', 'data', name), 'utf8');
const diplomacy = parseDataset(read('diplomatie.csv'), 'diplomatie');
const countries = parseDataset(read('titres_et_institutions_par_pays.csv'), 'institutions_comparees');
const data = [...diplomacy, ...countries];

test('CSV handles BOM, CRLF, quoted commas, escaped quotes, multiline fields and empty cells', () => {
  assert.deepEqual(parseCSV('\uFEFFa,b,c\r\n"a,b","say ""bonjour""",\r\n"line 1\nline 2",é,中文\r\n\r\n'), [
    ['a', 'b', 'c'], ['a,b', 'say "bonjour"', ''], ['line 1\nline 2', 'é', '中文']
  ]);
  assert.deepEqual(parseCSV('a,b\nx,'), [['a', 'b'], ['x', '']]);
  for (const text of ['a,"unfinished', 'a,ab"cd', 'a,"b"c']) assert.throws(() => parseCSV(text));
});

test('malformed records and HTML error responses cannot become entries', () => {
  const header = 'chinois,francais,categorie,registre,definition,note';
  assert.throws(() => parseDataset(header + '\nx,y,titre,formel,unquoted,comma,note', 'test'));
  assert.throws(() => parseDataset(header + '\n,y,titre,formel,definition,note', 'test'));
  assert.throws(() => parseDataset('<html>Not found</html>', 'test'));
  assert.equal(parseDataset(header + '\n' + header + '\nx,y,titre,formel,definition,note', 'test').length, 1);
});

test('all existing entries load with valid fields and no repeated header', () => {
  assert.equal(diplomacy.length, 103);
  assert.equal(countries.length, 49);
  assert.equal(data.length, 152);
  assert.equal(new Set(countries.map(item => item.pays)).size, 8);
  assert.ok(data.every(item => item.registre === 'formel' && item.date === '2026-04'));
  assert.ok(data.every(item => item.chinois !== 'chinois'));
  // Existing duplicate terms are deliberately retained.
  assert.equal(diplomacy.filter(item => item.chinois === '国际民航组织秘书长').length, 2);
});

test('UNESCO and other fields containing commas stay intact', () => {
  const item = diplomacy.find(item => item.chinois === '联合国教科文组织');
  assert.equal(item.francais, 'Organisation des Nations unies pour l’éducation, la science et la culture (UNESCO)');
  assert.equal(item.definition, 'Institution spécialisée de l’ONU dans les domaines de l’éducation, de la science et de la culture');
  assert.equal(item.categorie, 'organisation internationale');
  assert.equal(item.note, 'UNESCO 常直接保留缩写');
  assert.equal(item.reference, 'unesco.org');
  assert.match(diplomacy.find(item => item.chinois === '联合国系统').definition, /fonds, programmes/);
  assert.match(diplomacy.find(item => item.chinois === '联合国经济及社会理事会').definition, /économiques, sociales/);
  const uk = countries.find(item => item.chinois === '外交、联邦及发展事务部');
  assert.equal(uk.francais, 'ministère britannique des Affaires étrangères, du Commonwealth et du Développement');
  assert.match(uk.definition, /diplomatie, du Commonwealth/);
  assert.match(uk.note, /Foreign, Commonwealth & Development Office/);
  assert.match(countries.find(item => item.chinois === '外交大臣').note, /Foreign, Commonwealth/);
  for (const term of ['外交部', '外交部长']) {
    assert.match(countries.find(item => item.pays === '摩洛哥' && item.chinois === term).francais, /étrangères, de la Coopération/);
  }
  const car = countries.find(item => item.pays === '中非共和国' && item.chinois === '总理');
  assert.equal(car.francais, 'Premier ministre, Chef du gouvernement');
  assert.match(car.note, /Premier ministre, Chef du gouvernement/);
});

test('Chinese and French searches find the requested terms', () => {
  for (const [chinois, queries] of [
    ['大使', ['大使', 'Ambassadeur', 'AMBASSADEUR']],
    ['联合国教科文组织', ['联合国教科文组织', 'UNESCO', "Organisation des Nations unies pour l'education"]],
    ['国务卿', ['国务卿', 'Secrétaire d’État des États-Unis', "secretaire d'etat des etats-unis"]]
  ]) {
    for (const keyword of queries) assert.ok(filterEntries(data, { keyword }).some(item => item.chinois === chinois), keyword);
  }
});

test('keyword, domain and category combine with AND in all eight combinations', () => {
  const sample = [
    { pays: '美国', chinois: '国务卿', francais: 'Secrétaire', definition: '', note: '', categorie: 'titre', source: 'institutions_comparees' },
    { pays: '', chinois: '大使', francais: 'Ambassadeur', definition: '', note: '', categorie: 'titre', source: 'diplomatie' },
    { pays: '美国', chinois: '国务院', francais: 'Département', definition: '', note: '', categorie: 'institution', source: 'institutions_comparees' }
  ];
  const cases = [
    [{}, 3], [{ keyword: '美国' }, 2], [{ source: 'institutions_comparees' }, 2], [{ category: 'titre' }, 2],
    [{ keyword: '美国', source: 'institutions_comparees' }, 2], [{ keyword: '美国', category: 'titre' }, 1],
    [{ source: 'institutions_comparees', category: 'titre' }, 1],
    [{ keyword: '美国', source: 'institutions_comparees', category: 'titre' }, 1]
  ];
  for (const [filters, count] of cases) assert.equal(filterEntries(sample, filters).length, count);
  assert.equal(filterEntries(data, { keyword: 'UNESCO', category: 'titre' }).length, 0);
  assert.equal(filterEntries(data, { keyword: '   ', source: '', category: '' }).length, 152);
});

test('country-specific titles retain the country and full name', () => {
  const us = filterEntries(data, { keyword: '国务卿', source: 'institutions_comparees', category: 'titre' });
  const primaryMatches = us.filter(item => item.chinois.includes('国务卿'));
  assert.equal(primaryMatches.length, 3);
  assert.ok(primaryMatches.every(item => item.pays === '美国'));
  // Full-text search also finds the French entry whose note compares it with the US title.
  assert.ok(us.some(item => item.pays === '法国' && item.note.includes('国务卿')));
  const secretaries = filterEntries(data, { keyword: "secretaire d'etat", category: 'titre' });
  for (const country of ['美国', '英国', '法国', '摩洛哥']) assert.ok(secretaries.some(item => item.pays === country));
});
