# -*- coding: utf-8 -*-
__author__      = "reza0310"
"""
    CSS_compiler.py: A small script used to assemble the style rules for a given html from a large stylesheet.
    TODO (unnecessary right now):
        1) Implement special CSS magic syntax like comparative things and @ rules on multiple rules
"""

# ---------- LIBRARIES IMPORTS ----------
import os
import os.path
import sys
from TOML_parser import parse_toml, find_and_parse_toml


# ---------- CLASSES ----------
class DictWithUnhashableAsKey():
    def __init__(self, frome=None):  # Exécuté par "a = DictWithUnhashableAsKey()"
        self.keyse = {}
        self.valuese = {}
        self.index = 0
        if frome != None:
            if type(frome) != dict:
                raise Exception("DictWithUnhashableAsKey: Can't convert non-dict object to DictWithUnhashableAsKey")
            for key in frome:
                self.add(key, frome[key])

    def __getitem__(self, key):  # Exécuté par "a[key]"
        for i in range(self.index):
            if self.keyse[i] == key:
                return self.valuese[i]
        raise Exception("DictWithUnhashableAsKey: Tried to access inexisting key")

    def __len__(self):  # Exécuté par "len(a)"
        return len(self.keyse)

    def __iter__(self):  # Exécuté par "for key, value in a"
        return DictWithUnhashableAsKey_ITERATOR(self.keyse, self.valuese, self.index)

    def __add__(self, other):  # Exécuté par "a + other"
        if type(other) == dict:
            other = DictWithUnhashableAsKey(other)
        elif type(other) != DictWithUnhashableAsKey:
            raise Exception("DictWithUnhashableAsKey: Can't add DictWithUnhashableAsKey and "+str(type(other)))
        for key, value in other:
            self.add(key, value)

    def add(self, key, value):
        self.keyse[self.index] = key
        self.valuese[self.index] = value
        self.index += 1
        return self

    def update(self, key, value):
        for i in range(self.index):
            if self.keyse[i] == key:
                self.valuese[i] += value
                return self
        raise Exception("DictWithUnhashableAsKey: Tried to update inexisting key")

    def keys(self):
        return self.keyse.values()

    def values(self):
        return self.valuese.values()


class DictWithUnhashableAsKey_ITERATOR():  # Iterateur pour intérer sur un DictWithUnhashableAsKey()
    def __init__(self, keys, values, max_index):
        self.keys = keys
        self.values = values
        self.index = 0
        self.max = max_index
    
    def __next__(self):  # Exécuté par "a = DictWithUnhashableAsKey()"
        if self.index == self.max_index:
            raise StopIteration()
        else:
            out = self.keys[self.index], self.values[self.index]
            index += 1
            return out


# ---------- FUNCTIONS ----------
def string_is_same(big_string: str, subindex: int, searched: str) -> int:
    """
    ENTRÉE: L'index de début d'une partie de big_string que l'on pense être searched
    SORTIE: Un booléen disant si oui ou non searched se trouve dans big_string commencant a subindex
    """
    i = 0
    while subindex+i < len(big_string) and i < len(searched) and searched[i] == big_string[subindex+i]:
        i += 1
    return i == len(searched)


def get_out(string: str, index: int, opener: str = None, closer: str = None) -> int:
    """
    ENTRÉE: L'index d'un " ou d'un { d'où on voudrait sortir, le string a parcourir et potentiellement un closer si il est différent de l'opener (genre })
    SORTIE: L'index du closer associé à l'opener d'index donné
    """
    if opener == None:
        opener = string[index]
    if closer == None:
        closer = opener
    pile = 1
    while pile > 0 and index < len(string):
        index += 1
        if string_is_same(string, index, closer) and string[index-1] != "\\":
            pile -= 1
        elif string_is_same(string, index, opener) and string[index-1] != "\\":  # index ne peut pas être 0 ici. De plus, si opener == closer mettre ce test en elif le désactivera ce qui est voulu.
            pile += 1
    return index


def monoline_css(css: str) -> str:
    """
    ENTRÉE: Un document CSS tel quel
    SORTIE: Le même document mais sans aucun caractère inutile
    """
    # On veut tej les commentaires, indentations, espaces et retours chariots hors immutables
    # On fait un parcours des mutables
    output = ""
    index = 0
    inrules = False
    while index < len(css):
        if not css[index] in ["\t", " ", "\n"]:  # On tej les indentations, espaces et retours chariots
            skipped = False
            match css[index]:
                case "/":
                    if index < len(css)-1 and css[index+1] == "*":  # On tej les commentaires, espaces et retours chariots
                        index = get_out(css, index, "/*", "*/")

                case '"':  # On évite de tej les strings
                    i = get_out(css, index)
                    skipped = True

                case "{":
                    inrules = True
                    output += css[index]

                case "}":
                    inrules = False
                    output += css[index]

                case ":":
                    if inrules:  # On évite de tej les espaces dans les règles
                        i = get_out(css, index, closer=";")
                        skipped = True

                case _:
                    output += css[index]

            if skipped:
                output += css[index]
                while index < i:
                    index += 1
                    output += css[index]
                #index -= 1  # Pour contrecarrer le +1 à la ligne d'en dessous
        index += 1
    return output


def load_css(path: str) -> tuple[dict[str, set], dict[str, set], dict[str, set]]:
    """
    DESCRIPTION: Une fonction permettant de charger un fichier CSS.
    ENTRÉE: Le path du fichier à charger.
    SORTIE: Trois dictionnaire: un pour les ids, un pour les classes et un pour les balises. Chacun de ces dictionnaires contient en clef le nom d'un lien et en valeur un set des règles correspondantes.
    """
    with open(path, "r") as sheet:
        rules = sheet.read()
    ruleset = monoline_css(rules)
    ruleset = ruleset.replace("}", "{").split("{")
    name = ""
    outdicts = ({},{},{})
    for i in range(len(ruleset)):
        if i%2 == 0:
            name = ruleset[i]
        else:
            for x in name.split(","):
                # We check this rule's type
                match x[0]:
                    case "#":
                        out_dict_index = 1
                    case ".":
                        out_dict_index = 2
                    case _:
                        out_dict_index = 0
                if x in outdicts[out_dict_index].keys():  # Éponyme
                    outdicts[out_dict_index][x] = outdicts[out_dict_index][x].union(set(ruleset[i].split(";")[:-1]))  # On fait des sets pour que "a=b;e=d" == "e=d;a=b"
                else:
                    outdicts[out_dict_index][x] = set(ruleset[i].split(";")[:-1])  # On vire les \n pour éviter les règles vides du ;\n
    return outdicts


def load_html(path: str) -> tuple[set[str], set[str], set[str]]:
    """
    DESCRIPTION: Une fonction permettant d'extraire les balises, ids et classes d'un fichier HTML.
    ENTRÉE: Le path du fichier à analyser.
    SORTIE: les listes des balises, ids et classes relevantes.
    """
    outlists = [set(), set(), set()]
    put = False
    out_list_index = 0
    nom = ""
    sortie = 0

    with open(path, "r") as file:
        data = file.read()

    i = 0
    while i < len(data):
        match data[i]:
            case "i":
                out_list_index = 1
                if string_is_same(data, i, 'id="'):
                    i += 3
                    sortie = get_out(data, i)
                    noms = ["#"+x for x in data[i+1:sortie].split(" ")]
                    put = True
            case "c":
                out_list_index = 2
                if string_is_same(data, i, 'class="'):
                    i += 6
                    sortie = get_out(data, i)
                    noms = ["."+x for x in data[i+1:sortie].split(" ")]
                    put = True
            case "<":
                out_list_index = 0
                if i < len(data)-1 and data[i+1] != "/":
                    sortie = get_out(data, i, closer=">")
                    noms = [data[i+1:sortie].split(" ")[0]]
                    put = True
                    sortie = i+len(noms[0])+1
        if put:
            outlists[out_list_index] = outlists[out_list_index].union(set(noms))
            put = False
            i = sortie+1
        else:
            i += 1

    return tuple(outlists)


def sheet_css(dict_balises: dict[str, set], dict_ids: dict[str, set], dict_classes: dict[str, set]) -> str:
    """
    DESCRIPTION: Une fonction permettant reformer une feuille de style CSS à partir du format de données traité.
    ENTRÉE: Les dictionnaires de règle pour les balises, ids et classes tels que renvoyés par load_css.
    SORTIE: Le srting correspondant à la feuille de style CSS associée (optimisé et structuré).
    """
    # Trier par ordre de priorité croissante
    dicts = [dict_balises, dict_ids, dict_classes]

    # Regrouper les règles éponymes est déjà fait par load_css donc on va regrouper directement les règles identiques
    reverse_rules = DictWithUnhashableAsKey()
    for dicte in dicts:
        for rule_name in dicte:
            if dicte[rule_name] in list(reverse_rules.keys()):
                reverse_rules.update(dicte[rule_name], [rule_name])
            else:
                reverse_rules.add(dicte[rule_name], [rule_name])

    # On vérifie que les règles ne contiennent pas plusieurs fois la même définition
    for x in reverse_rules.keys():  # On parcourt les règles (sets)
        defined = []
        for y in x:  # On parcourt les règles (strings du set)
            split = y.split(":")
            if len(split) != 2:
                raise Exception("CSS ERROR: invalid rule "+y+" from rulename "+str(reverse_rules[x]))
            if split[0] in defined:
                raise Exception("CSS ERROR: rule "+split[0]+" from rulename "+str(reverse_rules[x])+" written twice")
            else:
                defined.append(split[0])
    
    # Mettre en forme
    rulenames = []
    fused_dict = {}
    output = ""
    for x in dicts:
        fused_dict.update(x)

    rulenames = list(fused_dict.keys())
    while rulenames:
        rulename = rulenames.pop(0)
        rules = fused_dict[rulename]
        reversed_rulename = reverse_rules[rules]
        for x in reversed_rulename:
            if x != rulename:
                rulenames.remove(x)
        string_rulename = ", ".join(reversed_rulename)
        string_rules = ";\n".join(["    "+r for r in rules])+";\n"
        output += string_rulename+" {\n"+string_rules+"}\n\n"

    return output[:-1]


if __name__ == "__main__":
    # ---------- CONFIGURATION IMPORTING AND VERIFICATION ----------
    if (len(sys.argv) > 1):
        config_file = sys.argv[1]
    else:
        config_file = "../../configs/preprocessor_config.toml"
    with open(config_file, "r") as f:
        configs = parse_toml(f.read())
    
    for config in configs.keys():
        assert os.path.isdir("../../web/"+config.lower()+"/public"), "CONFIGURATION ERROR: HTML output root isn't a valid directory"
        assert os.path.isfile(configs[config]["css_file"]), "CONFIGURATION ERROR: stylesheet invalid"

        # ---------- MAIN LOOP ----------
        pile_d_exploration = ["../../web/"+config.lower()+"/public"]
        stylesheet = load_css(configs[config]["css_file"])
        while pile_d_exploration:
            element = pile_d_exploration.pop(0)
            if os.path.isdir(element):
                # On explore le dossier
                pile_d_exploration += [element+"/"+x for x in os.listdir(element)]
            else:
                # On process le fichier
                comparaison = load_html(element)
                authorized_shit = ({},{},{})
                for shit_index in range(len(stylesheet)):
                    for key_shit in stylesheet[shit_index].keys():
                        if key_shit in comparaison[shit_index]:
                            authorized_shit[shit_index][key_shit] = stylesheet[shit_index][key_shit]
                made_up_sheet = "<style>\n"+sheet_css(*authorized_shit)+"</style>"
                with open(element, "r") as file:
                    data = file.read()
                data = data.replace("%css%", made_up_sheet, 1)
                with open(element, "w") as file:
                    file.write(data)  # Ne devrait pas poser de pb de mix nouveau / ancien dans la mesure ou len(nouveau) > len(ancien) et qu'on append pas
