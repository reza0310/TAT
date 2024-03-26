# A propos de notre syntaxe particulière pour la compilation HTML/CSS

## Le TOML
Chacun de nos fichiers HTML que l'on souhaite compiler doit commencer par du TOML valide entre accolades {}.
Ce TOML devra contenir obligatoirement contenir trois balises: local, global et default. De ce fait, si vous ne voulez pas d'information dans votre TOML, faites comme ceci:
<br>{<br>[local]<br>[global]<br>[default]<br>}<br>
Toute autre balise que ces trois là sera ignorée. Les variables, variables spéciales et autres définies dans local ne seront valables que pour ce fichier là. Les variables, variables spéciales et autres définies dans global seront transmises à tout fichier chargé après le fichier actuel. Les variables, variables spéciales et autres définies dans default ne seront accessibles que dans ce fichier là à la condition qu'elle ne soit définie nulle part ailleurs. Les compilations de fichier sont indépendantes les unes des autres. De ce fait, si un fichier utilise par exemple un header, ses variables globales seront transmises. Dusse un fichier définir une variable globale déjà définie, elle sera redéfinie.
Les variables locales sont prioritaires sur leurs éponymes globales qui sont elles-mêmes prioritaires sur leurs éponymes par défaut.

## Variables dans TOML spéciales
- containers: Pour chaque fichier dans cette liste, on traite le fichier puis on remplace sa variable "%content%" par l'état actuel du fichier que l'on est en train de traiter. Il est fortement déconseillé d'en mettre en global.
- separator: Une liste est parsée de cette façon: pour tous les éléments de la liste sauf le dernier, on met l'élément suivi du separator. Le dernier n'est pas suivi du separator. Le separator de base est ", ".

## Variables hors TOML spéciales
Les variables hors toml sont traitées après les containers. Dans le HTML, les noms entourés de deux % sont considérés comme des variables. Par exemple, "%x%" sera considéré comme la variable x. Le traitement des variables est le suivant:
1) On cherche dans les variables locales si une correspond a ce nom et si c'est le cas on remplace.
1.5) Si cette variable est un string qui pointe sur un fichier (avec le cwd set au dossier où se trouve le fichier actuel), ce fichier est traité et c'est son contenu qui est mis dedans.
2) Si l'on n'a pas trouvé, on cherche dans les variables globales si une correspond a ce nom et si c'est le cas on remplace.
2.5) Pareil que 1.5).
3) Si l'on n'a pas trouvé, on cherche dans les variables par défaut si une correspond a ce nom et si c'est le cas on remplace.
3.5) Pareil que 2.5).
4) Si l'on n'a pas trouvé, on considère ce qu'il y a entre % comme le contenu de la variable.
4.5) Pareil que 3.5).

De ce fait, si vous voulez mettre le path d'un fichier existant dans le document, vous avez trois solutions:
1) Le mettre comme seul élément d'une liste dans le toml (exemple: ["/files/monfichier.extension"]).
2) Séparer ses éléments dans toute une liste et changer le separator (exemple: ["/files", "monfichier.extension"] avec "/" comme separator).
3) Ne pas en faire une variable (exemple: mettre juste /files/monfichier.extension).
Il y a probablement d'autres techniques aussi jouant sur le fait que l'élément entre % est traité comme un nom de variables mais franchement tenez-vous en à l'option 3 !

De même, si vous voulez mettre du texte entouré de % dans votre résultat, créez une variable globale du genre `myvar = "%myvar%"`.
Maintenant les variables spéciales:
- %content%: La première variable de ce nom sera remplacée par le fichier qui l'a appelé en tant que container si il y a lieu.
- %css%: La première variable de ce nom sera remplacée par le lien vers la feuille de style ou le style lui-même par le compilateur css (une fois tout le html terminé) si il en reste au moins une (variable de ce nom).

## Notes sur l'algorithme
L'algorithme est fait de sortes que si un fichier sans %content% est appelé en container, il remplace le fichier qui l'a appelé. Par contre, si un fichier est appelé en variable et que le fichier parent ne contient pas de %content% alors le fichier enfant est ignoré.
Dusse-t-il y avoir plusieurs %content% et %css%, la première sera remplacée et les suivantes ignorées.
