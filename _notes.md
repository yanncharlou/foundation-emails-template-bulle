ZURB EMAIL FOUNDATION TEST
---
- [ZURB EMAIL FOUNDATION TEST](#zurb-email-foundation-test)
- [FONCTIONEMENT](#fonctionement)
    + [GESTION DES PARTIALS](#gestion-des-partials)
    + [ARCHIVAGE](#archivage)
- [PROBLEMES RENCONTRÉS](#problemes-rencontr-s)
  * [VALIDATION W3C](#validation-w3c)
  * [AWS](#aws)
  * [MINIFICATION DES CSS DANS LE HEAD](#minification-des-css-dans-le-head)
  * [CONFUSION ENTRE NPM RUN BUILD et GULP BUILD --production](#confusion-entre-npm-run-build-et-gulp-build---production)
  * [INSTALLATION](#installation)
    + [changer le chemin de gulp dans le "package.json"](#changer-le-chemin-de-gulp-dans-le--packagejson-)
    + [node-sass ne veut pas executer de postinstall](#node-sass-ne-veut-pas-executer-de-postinstall)
    + [Jpegtran non trouvé (ENOENT)](#jpegtran-non-trouv---enoent-)
    + [optiPNG non trouvé (ENOENT)](#optipng-non-trouv---enoent-)
  * [RETOURS](#retours)
  * [FAQ](#faq)

<small><i><a href='http://ecotrust-canada.github.io/markdown-toc/'>Table of contents generated with markdown-toc</a></i></small>



Ce dossier teste le système zurb foundation emails avec le salon MIDEST 2020.

## FONCTIONEMENT ##

- chaque newsletter a son sous-dossier:
``n[INDEX_SALON]-[DATE(YYMMDD)]-[NOM_SALON]-[NOM-NEWS]/[INDEX-SALON]-[NOM_SALON]-[NOM_NEWS].html``
- Si la newsletter est trop ancienne, la mettre dans archive pour alléger le watcher de gulp


- mettre le dossier  node_modules  en blacklist sur corbian backup :
    - click-droit "éditer la tâche"
    - onglet "exclusions" de la barre de gauche
    - dans la fenêtre "Exclure ces fichiers" cliquer sur "Ajouter" puis choisir "masque"
    - coller: *\node_modules\\\*

#### GESTION DES PARTIALS ####

- pas de partials uniques, même dans des sous dossiers
- besoin de nommer les partials comme suit: ``n[index_de_la_news]/n[index_de_la_news]-[nom_du_partial].hbs``
- les partials sont ajoutées comme suit: ``{{> n7-topbar}}``. Si le partial se trouve dans un sous dossier, c'est la même syntaxe. Le moteur de template ne gère pas les inclusions de sous dossiers mais gère les inclusions de fichiers même s'ils sont dans des sous-dossiers.
Les noms de fichiers doivent être uniques.

#### ARCHIVAGE ####

Une fois la news terminée, ne pas oublier d'archiver la news.

- Cela permet d'envoyer seulement la news courante à Emailonacid.

- Cela permet à Gulp de ne surveiller qu'une seule news.

- N'archiver que la section pages, car les partials sont par définition réutilisables à travers les news


## PROBLEMES RENCONTRÉS ##

### VALIDATION W3C ###

- Si des règles ne gênent pas l'envoi et sont détectées comme erreur de la part de w3c:
    1. copier le message
    2. ajouter le message en tant qu'expression régulière à la suite dans ``./validation.js``: !/[message]/.test(message)
        Exemple:
            - Le message ``The “align” attribute on the “td” element is obsolete. Use CSS instead`` s'affiche
            - ajouter 
                ``
                [ligne précédente] &&
                !/The “align” attribute on the “td” element is obsolete. Use CSS instead./.test(message)
                ``
    3. relancer ``gulp lint`` ou ``npm run build``




### AWS ###

- Si aws remplace les urls, l'enlever dans la chaine d'éxécution de gulp. La tâche est nommée ``aws``

- exemple: 
```javascript
// Build emails, then send to EMAIL
gulp.task('mail',
// gulp.series('build', creds, aws, mail));
gulp.series('build', creds, mail));
```

### MINIFICATION DES CSS DANS LE HEAD ###

- se fait via gulp-htmlmin
- mettre ``minifyCSS `` à ``false`` dans ``gulpfile.babel.js``


### CONFUSION ENTRE NPM RUN BUILD et GULP BUILD --production ###

- modification dans ``package.json``: ``"build": "gulp build --production",``

### ESPACE POUR AERER EN MOBILE ###

S'il faut mettre de l'espace en mobile pour aérer le contenu, la classe ".hide-for-large" ne marche pas pour google et yahoo.
Mettre des spacers là ou ca ne se voit pas en desktop.

### ARCHIVAGE DES PAGES ###

- Lors de l'envoi de test emailonacid, toutes les news du dossier ``dist/`` sont envoyées.
- Lors de la tache de build de gulp, le dossier est d'abord effacé puis les pages sont recompilées dans ``dist/``

Afin de prévalualiser les news anciennes, un dossier ``archives/`` qui contient les pages a été créé à la racine du dossier.


### INSTALLATION ###

#### changer le chemin de gulp dans le "package.json" ####

- plusieurs étapes à regarder dans :
    REF : https://github.com/foundation/foundation-emails/issues/920

#### node-sass ne veut pas executer de postinstall ####

- Si node-sass merde, npm install --global --production windows-build-tools 
    REF: https://github.com/nodejs/node-gyp#on-windows 
- puis ``npm rebuild node-sass``
- puis `` npm install``

#### Jpegtran non trouvé (ENOENT) ####

- Message:
    .\node_modules\jpegtran-bin\vendor\jpegtran.exe ENOENT
    ``npm rebuild jpegtran-bin``
    REF: https://github.com/imagemin/imagemin/issues/154

#### optiPNG non trouvé (ENOENT) ####

- npm rebuild
    REF: https://github.com/panteng/wechat-h5-boilerplate/issues/5#issuecomment-389127052


### RETOURS ###

- pas possible de mettre bootstrap et foundation ensemble, conflits comme .container et .row par exemple.
- le runner fait péter le terminal sur les ctrl+c
- ne transforme pas certaines balises pour le web (\<p\>)
- besoin de switch entre ``npm run start`` et ``npm run build`` pour voir les class des éléments
- besoin de faire ``npm run start`` puis ``npm run build`` lors d'ajout d'images


### FAQ ###