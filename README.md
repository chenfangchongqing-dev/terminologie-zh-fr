# terminologie-zh-fr
Corpus terminologique français-chinois pour la traduction, l’interprétation et l’enseignement

Consultation : https://chenfangchongqing-dev.github.io/terminologie-zh-fr/

## Recherche

- Saisir un mot-clé chinois ou français, ou sélectionner un domaine ou une catégorie.
- Les trois critères se combinent. La recherche porte aussi sur le pays, la définition, la note et l’équivalent d’interprétation ; les accents, majuscules et variantes d’apostrophe ne bloquent pas la recherche.
- « Réinitialiser » efface les trois critères et revient au message d’accueil. Les données restent chargées.
- Les domaines disponibles correspondent aux fichiers chargés : Diplomatie et Institutions comparées. Droit et Économie ne sont pas proposés tant que leurs données ne sont pas disponibles.
- Sur téléphone, chaque résultat présente ses champs verticalement, avec le pays, le terme chinois, le français et les notes.

## Données

Les fichiers CSV sont encodés en UTF-8. Tout champ contenant une virgule, un retour à la ligne ou un guillemet doit être entouré de guillemets doubles. À l’intérieur d’un champ, un guillemet double s’écrit `""`. Chaque ligne doit avoir le même nombre de champs que l’en-tête.

Un fichier invalide ou indisponible est signalé ; les autres fichiers restent consultables. Les catégories proviennent des données. Les textes et doublons existants sont conservés ; la correction du format CSV ne constitue pas une révision terminologique.

Lors d’une mise à jour des CSV, changer aussi `dataVersion` dans `index.html` pour éviter de réutiliser une ancienne copie en cache sur GitHub Pages. Actualiser de même le paramètre `v` du script si le parseur change.

## Vérification locale

Avec Node.js (18 ou ultérieur), lancer les tests de données, de parsing et de recherche :

```sh
node --test tests/terminology.test.js
```

Pour consulter le site localement, lancer `python3 -m http.server 8000`, puis ouvrir http://localhost:8000/ (le chargement CSV nécessite HTTP).

Vérification manuelle : rechercher « 大使 » / « Ambassadeur », « 联合国教科文组织 » / « UNESCO », « 国务卿 » / « Secrétaire d’État » ; combiner avec domaine et catégorie ; vérifier une combinaison sans résultat, puis effacer chaque critère et utiliser « Réinitialiser ». Vérifier aussi les pays et les longues appellations à une largeur de 320 à 430 pixels.


## 综合检索入口（2026-11）

首页 `index.html` 是汉法综合检索入口，提供：

- 中法双语／单语关键词搜索，综合、术语、对照语料和新闻分类筛选。
- 中文／法语对照展示，以及来源、日期、对应关系、核验状态和课堂任务。
- 复制法语片段及课堂任务；原文通过发布方链接查阅。
- 旧外交及机构职衔术语完整表格保留在 `terminology.html`，不删减原有两份CSV。
- 精选语料与新闻记录位于 `data/curated-resources.json`，新增时需填写来源和核验记录。旧CSV中的152条术语标注“未逐项复核”，不会自动取得“已核验”状态。

### 对应关系与核验边界

`relation` 说明记录是术语对应、同源句段平行，还是法语新闻中的单独用例。`verification` 独立表明核验程度：

- `verified`：该条所陈述的来源和对应层级已核查。
- `partial`：已核查指定语言来源，但另一语言报道或全文对应未核验。
- `unreviewed`：继承的原有数据，未完成当前新版的逐条核验。

有来源链接不代表中法原文已经逐句对齐；禁止把未核查的中文主题说明当作原文标题。站点仅保留教学所需短片段；涉及第三方全文请跳转原网站，并遵守版权与授权要求。

### 开发与检查

```sh
node --test tests/terminology.test.js tests/integrated-search.test.js
python3 -m http.server 8000
```

浏览器访问 `http://localhost:8000`，尝试“新质生产力”、`UNESCO`、`大使`，确认语言切换、分类筛选、空结果、原文链接、手机布局和旧表格链接均正常。GitHub Pages 地址：`https://chenfangchongqing-dev.github.io/terminologie-zh-fr/`。

当前首版采用静态精选数据，**尚未接入自动媒体采集、AI教学智能体或登录后的个人学习记录**。
