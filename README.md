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

## Vérification locale

Avec Node.js (18 ou ultérieur), lancer les tests de données, de parsing et de recherche :

```sh
node --test tests/terminology.test.js
```

Pour consulter le site localement, lancer `python3 -m http.server 8000`, puis ouvrir http://localhost:8000/ (le chargement CSV nécessite HTTP).

Vérification manuelle : rechercher « 大使 » / « Ambassadeur », « 联合国教科文组织 » / « UNESCO », « 国务卿 » / « Secrétaire d’État » ; combiner avec domaine et catégorie ; vérifier une combinaison sans résultat, puis effacer chaque critère et utiliser « Réinitialiser ». Vérifier aussi les pays et les longues appellations à une largeur de 320 à 430 pixels.
