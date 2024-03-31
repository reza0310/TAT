# -*- coding: utf-8 -*-
__author__      = "reza0310"
"""
    WEBPAGES_compiler.py: A small script used to compile the HTML pages from our custom format to normal HTML pages.
"""

# ---------- LIBRARIES IMPORTS ----------
import os
import os.path
import sys
from TOML_parser import parse_toml, find_and_parse_toml


# ---------- CLASSES ----------
class Tree():
    def __init__(self, name: str):
        self.name = name
        self.fathers = set()
        self.children = set()

    def print(self):
        print("Name's", self.name)
        print("My fathers:", self.get_fathers())
        print("My children:", self.get_fathers())

    def get_fathers(self) -> list:
        return [x.name for x in self.fathers]

    def get_children(self) -> list:
        return [x.name for x in self.children]

    def print_up(self):
        for x in self.fathers:
            x.print()
            print()
            x.print_up()

    def print_down(self):
        for x in self.children:
            x.print()
            print()
            x.print_down()


# ---------- FUNCTIONS ----------
def check(checking: Tree) -> bool:
    """
    DESCRIPTION: Un wrapper pour forcer la variable liste de la fonction récursive à être initialisée vide.
    """
    return check_recur(checking, [])


def check_recur(checking: Tree, liste: list) -> bool:
    """
    ENTRÉE: Un noeud de la classe Tree.
    SORTIE: Un booléen disant si oui ou non la structure d'arbre vérifiée contient une boucle infinie.
    """
    if checking.name in liste:
        return False
    liste.append(checking.name)
    for x in checking.fathers:
        if not check_recur(x, liste):
            return False
    return True


def priority_process(searched: str, toml: dict, variables: dict) -> str:
    """
    ENTRÉE: Le nom de la variable à chercher selon les saintes priorités ainsi que le toml et l'environnement dans lesquels chercher.
    SORTIE: La sainte parole de ce qu'on à dire les saintes priorités par rapport à notre variable.
    """
    if searched in toml["local"].keys():
        return toml["local"][searched]
    elif searched in variables.keys():
        return variables[searched]
    elif searched in toml["default"].keys():
        return toml["default"][searched]
    else:
        raise Exception("HTML parsing: Variable "+searched+" not found.")


def process_file(filepath: str) -> str:
    """
    DESCRIPTION: Une fonction wrapper permettant spécifiquement de compiler un fichier.
    ENTRÉE: Le path du fichier à compiler.
    SORTIE: Le fichier compilé si possible, None si il y a erreur.
    """
    oldpwd = os.getcwd()  # On choppe le cwd pour le reset car process_file_recur le modifie

    resultat, _ = process_file_recur(filepath, {}, Tree(filepath))
    if resultat == None:
        raise Exception("HTML parsing: infinite recursion detected")

    os.chdir(oldpwd)

    with open(filepath, "r") as file:
        toml, _ = find_and_parse_toml(file.read())
    if "output_name" not in toml["config"].keys() or type(toml["config"]["output_name"]) != str:
        raise Exception("HTML parsing: invalid output name")

    return toml["config"]["output_name"], resultat


def process_file_recur(filepath: str, variables: dict, node: Tree) -> tuple[str, dict]:
    """
    DESCRIPTION: Une fonction récursive gérant la compilation d'un fichier avec ses parents et enfants.
    ENTRÉE: Le path du fichier à compiler, les variables d'environnement (variables se transmettant d'un fichier à l'autre) et le noeud d'arbre correspondant au fichier en étude.
    SORTIE: Le fichier compilé si possible, None si il y a erreur et les variables en deuxième argument
    """
    # On charge le fichier
    with open(filepath, "r") as file:
        toml, html = find_and_parse_toml(file.read())
    if html[0] == "\n":  # Le fait de virer le TOML fait ressortir de saut de ligne qui le sépare du HTML.
        html = html[1:]

    # On vérif le TOML
    if not ("local" in toml.keys() and "global" in toml.keys() and "default" in toml.keys() and "config" in toml.keys() and \
            "containers" in toml["config"].keys() and "output_name" in toml["config"].keys()):
        raise Exception("HTML parsing: invalid TOML in file "+filepath)

    # On set le cwd au dossier du filepath
    dir_path = filepath.replace(filepath.split("/")[-1], "")
    if dir_path:
        os.chdir(filepath.replace(filepath.split("/")[-1], ""))

    # Save variables
    variables.update(toml["global"])
    
    # Containers processing
    parents = toml["config"]["containers"]
    parent_nodes = []
    if parents:  # Might be None, can be [], could be "" if an imbecile made the toml
        for x in parents:
            parent_nodes.append(Tree(x))
            # Add containers to parents
            node.fathers.add(parent_nodes[-1])
            # Add himself to parent's children
            parent_nodes[-1].children.add(node)
        # Use recursion
        if check(node):
            for x in parent_nodes:
                result, new_vars = process_file_recur(x.name, variables, x)
                variables.update(new_vars)
                if result == None:
                    return None, variables
                html = result.replace("%content%", html, 1)
        else:
            node.print()
            return None, variables

    invar = False
    var_start = 0
    outhtml = ""
    for i in range(len(html)):
        if html[i] == "%"and i < len(html)-1 and html[i+1] != ";":
            if not invar and i < len(html)-1 and html[i+1] != " ":  # Variable start
                invar = True
                var_start = i+1  # +1 car le substring inclus le char avant les :
            elif invar:  # Variable end
                invar = False
                var = html[var_start:i]
                if var != "css" and var != "content":
                    replacement = priority_process(var, toml, variables)
                    if type(replacement) == str and len(replacement) >= 2 and replacement[0] == "!":
                        replacement = replacement[1:]
                        subnode = Tree(replacement)
                        # Add self as their parent
                        subnode.fathers.add(node)
                        # Add them as children
                        node.children.add(subnode)
                        # Check them
                        if check(subnode):
                            # Call recursively on them
                            replacement, new_vars = process_file_recur(replacement, variables, subnode)
                            variables.update(new_vars)
                        else:
                            node.print()
                            return None, variables
                    elif type(replacement) == list or type(replacement) == dict:
                        separator = configs[config]["default_list_separator"]
                        if type(replacement) == dict and \
                        "content" in replacement.keys() and type(replacement["content"]) == list and \
                        "separator" in replacement.keys() and type(replacement["separator"]) == str :
                            separator = replacement["separator"]
                            replacement = replacement["content"]
                        replacement = separator.join(replacement)
                    # Place the resulting text at the right place
                    outhtml += replacement
                else:
                    outhtml += html[var_start-1:i+1]
        elif not invar:
            outhtml += html[i]
    return outhtml, variables


if __name__ == "__main__":
    # ---------- CONFIGURATIONS IMPORTING ----------
    if (len(sys.argv) > 1):
        config_file = sys.argv[1]
    else:
        config_file = "../../configs/preprocessor_config.toml"
    with open(config_file, "r") as f:
        configs = parse_toml(f.read())

    for config in configs.keys():
        # ---------- INIT ----------
        INPATH = "../../web/"+config.lower()+"/private"
        OUTPATH = "../../web/"+config.lower()+"/public"
        pile = [INPATH+"/"+x for x in os.listdir(INPATH)]

        # ---------- CONFIGURATION VERIFICATION ----------
        assert os.path.isdir(INPATH), "CONFIGURATION ERROR: input root isn't a valid directory"
        assert os.path.isdir(OUTPATH), "CONFIGURATION ERROR: output root isn't a valid existing directory"
        assert type(configs[config]["name_white_or_black_list"]) == bool, "CONFIGURATION ERROR: name list boolean must be boolean"
        assert type(configs[config]["name_list"]) == type(configs[config]["folder_names_blacklist"]) == list, "CONFIGURATION ERROR: lists must be lists"
        assert type(configs[config]["default_list_separator"]) == str, "CONFIGURATION ERROR: separator must be a string"

        # ---------- MAIN LOOP ----------
        while pile:
            element = pile.pop(0)
            if os.path.isdir(element) and element not in configs[config]["folder_names_blacklist"]:
                # On explore le dossier
                pile += [element+"/"+x for x in os.listdir(element)]
                if not os.path.isdir(element.replace(INPATH, OUTPATH)):
                    os.mkdir(element.replace(INPATH, OUTPATH))
            else:
                if (configs[config]["name_white_or_black_list"] and element.split("/")[-1] in configs[config]["name_list"]) or (not configs[config]["name_white_or_black_list"] and not element.split("/")[-1] in configs[config]["name_list"]):  # (Whitelist) or (Blacklist)
                    # On process le fichier
                    try:
                        name, content = process_file(element)
                    except Exception as e:
                        print(e)
                        raise Exception("ERROR IN FILE "+element)                        
                    filename = element.replace(INPATH, OUTPATH).replace(element.split("/")[-1], name)
                    with open(filename, "w+") as file:
                        file.write(content)
