# -*- coding: utf-8 -*-
__author__      = "reza0310"
"""
    TOML_parser.py: A small implementation of a TOML parser.
    TODO (unnecessary right now):
        1) Implement multi-lines strings
        2) Implement . relations (servers.alpha under servers, ...)
"""

containers = (('"', '"', False), ("'", "'", False), ("[", "]", True), ("{", "}", True), ("(", ")", True))
# Opener, Closer, Mutable? / Contain things?
openers = [x[0] for x in containers]
value_value_separators = (",", ";", "/")
key_value_separators = (":", "=")


def get_out(string: str, index: int) -> int:
    """
    ENTRÉE: L'index d'un opener
    SORTIE: L'index du closer associé
    """
    if string[index] not in openers:
        raise Exception("GET_OUT CALLED ON WRONG VALUE")
    pile = 1
    container = containers[openers.index(string[index])]
    while pile > 0:
        index += 1
        if string[index] == container[1] and string[index-1] != "\\":
            pile -= 1
        elif string[index] == container[0] and string[index-1] != "\\":  # index ne peut pas être 0 ici
            pile += 1
    return index


def find_toml(file: str) -> tuple[str, str]:
    """
    ENTRÉE: Un document HTML contenant une balise TOML d'entête
    SORTIE: Le TOML d'entête
    """
    if len(file) == 0 or file[0] != "{":
        raise Exception("INVALID SYNTAX")
    gateway = get_out(file, 0)
    return file[1:gateway], file[gateway+1:]


def clean_toml(toml: str) -> str:
    """
    ENTRÉE: Un document TOML tel quel
    SORTIE: Le même document mais sans aucun caractère inutile
    """
    # On veut tej les commentaires, indentations, espaces et lignes vides hors immutables
    # On fait un parcours des mutables
    index = 0
    while index < len(toml):
        if toml[index] in openers and not containers[openers.index(toml[index])][2]:
            index = get_out(toml, index)
        elif toml[index] == "\t" or toml[index] == " " or (toml[index] == "\n" and (index == 0 or toml[index-1] == "\n")):
            toml = toml[:index]+toml[index+1:]
            index -= 1
        elif toml[index] == "#":
            while index < len(toml) and toml[index] != "\n":
                toml = toml[:index]+toml[index+1:]
            index -= 1
        index += 1

    return toml


def split_toml_tags(toml: str) -> dict:
    """
    ENTRÉE: Un document TOML nettoyé
    SORTIE: Un dictionnaire représentant ce toml en données python
    """
    # On assume le texte nettoyé
    tomlist = []
    # On fait un parcours des mutables
    index = 0
    while index < len(toml):
        if toml[index] in openers and not containers[openers.index(toml[index])][2]:
            index = get_out(toml, index)
        elif toml[index] == "[" and index != 0 and toml[index-1] == "\n":
            tomlist.append(toml[:index])
            toml = toml[index:]
            index = -1
        index += 1
    tomlist.append(toml)

    dictio = {}
    for x in tomlist:
        parsed = parse_toml_tag(x)
        dictio[parsed[0]] = parsed[1]
    return dictio


def parse_toml_tag(tag: str) -> tuple[str, dict]:
    """
    ENTRÉE: Un texte représentant une balise TOML et son contenu
    SORTIE: Le titre et le contenu de ladite balise
    """
    titre = None
    # On fait un parcours des mutables
    index = 0
    while index < len(tag) and tag[index] != "]":
        if tag[index] in openers and not containers[openers.index(tag[index])][2]:
            index = get_out(tag, index)
        index += 1

    if index == len(tag)-1 or index == len(tag)-2:  # Cas balise vide (avec ou sans \n final)
        return tag[1:index], {}
    if index == len(tag):
        titre = None
        variables = tag.split("\n")
    else:
        if tag[index+1] == "\n":  # On vire le retour à la ligne pour pouvoir ensuite gérer le cas de la première variable sur la même ligne
            tag = tag[:index+1]+tag[index+2:]
        titre = tag[1:index]
        variables = tag[index+1:].split("\n")
    while "" in variables:  # Peut être inutile mais je suis pas sûr donc au cas où
        variables.remove("")
    dico_variables = {}
    for x in variables:
        nom, var = x.split("=", 1)
        dico_variables[nom] = interpret_variable(var)
    return titre, dico_variables


def interpret_variable(var: str):
    """
    ENTRÉE: Un string représentant une variable
    SORTIE: La variable dans son bon type
    """
    if var[0] == '"' or var[0] == "'":  # Cas str
        return var[1:-1]
    elif var == "true":  # Cas booléen
        return True
    elif var == "false":  # Cas booléen
        return False

    elif var[0] == "[":  # Cas liste
        # On fait un parcours des hors containers
        res = []
        var = var[1:]
        index = 0
        while index < len(var) and var[index] != "]":
            if var[index] in openers:
                index = get_out(var, index)
            elif var[index] in value_value_separators:
                res.append(interpret_variable(var[:index]))
                var = var[index+1:]
                index = -1
            index += 1
        if index == len(var):
            print("Var is", var)
            raise Exception("SYNTAX ERROR: UNCLOSED LIST")
        else:
            if var == "]":  # Empty list
                return []
            res.append(interpret_variable(var[:-1]))
            return res

    elif var[0] == "(":  # Cas tuple
        # On fait un parcours des hors containers
        res = []
        var = var[1:]
        index = 0
        while index < len(var) and var[index] != ")":
            if var[index] in openers:
                index = get_out(var, index)
            elif var[index] in value_value_separators:
                res.append(interpret_variable(var[:index]))
                var = var[index+1:]
                index = -1
            index += 1
        if index == len(var):
            print("Var is", var)
            raise Exception("SYNTAX ERROR: UNCLOSED LIST")
        else:
            res.append(interpret_variable(var[:-1]))
            return tuple(res)

    elif var[0] == "{":  # Cas dictionnaire
        # On fait un parcours des hors containers
        res = {}
        buffer = ""
        var = var[1:]
        index = 0
        iskey = True
        while index < len(var) and var[index] != "}":
            if var[index] in openers:
                index = get_out(var, index)
            elif iskey and var[index] in key_value_separators:
                buffer = var[:index]
                var = var[index+1:]
                index = -1
                iskey = False
            elif not iskey and var[index] in value_value_separators:
                res[buffer] = interpret_variable(var[:index])
                var = var[index+1:]
                index = -1
                iskey = True
            index += 1
        if index == len(var):
            print("Var is", var)
            raise Exception("SYNTAX ERROR: UNCLOSED DICT")
        else:
            res[buffer] = interpret_variable(var[:-1])
            return res

    elif var[0] != "-" and (var.count("-") - var.lower().count("e-")) > 0 or var.count(":") > 0:  # Cas horodate
        return var
    elif var.count(".") > 0 or var.lower().count("inf") > 0 or var.lower().count("nan") > 0 or (var.lower().count("e") > 0 and len(var) > 1 and var[1] != "x"):  # Cas flottant
        return float(var)
    else:  # On assume que c'est soit un int soit var[0] == "0" pour les cas binaire, hexa ou octal
        if len(var) > 1:
            if var[1] == "b":
                return int(var, 2)
            elif var[1] == "o":
                return int(var, 8)
            elif var[1] == "x":
                return int(var, 16)
        try:
            return int(var)
        except:
            print("Var is", var)
            raise Exception("INVALID (or not implemented) TOML SYNTAX")


def parse_toml(toml: str) -> dict:
    """
    ENTRÉE: Un string de TOML
    SORTIE: Un dictionnaire représentant la version parsée du TOML
    FONCTION: Fonction wrapper utilisée pour une importation facile dans d'autres scripts
    """
    return split_toml_tags(clean_toml(toml))


def find_and_parse_toml(file: str) -> tuple[dict, str]:
    """
    ENTRÉE: Un string contenant du TOML entre {}
    SORTIE: Un dictionnaire représentant la version parsée du TOML et le reste du fichier séparé
    FONCTION: Fonction wrapper utilisée pour une importation facile dans d'autres scripts
    """
    toml_part, html_part = find_toml(file)
    return parse_toml(toml_part), html_part


if __name__ == "__main__":
    data1 = """{
    # Voici un document TOML

    title = "TOML Example"

    [owner]
    name = "Tom Preston-Werner"
    dob = 1979-05-27T07:32:00-08:00

    [database]
    enabled = true
    ports = [ 8000, 8001, 8002 ]
    data = [ ["delta", "phi"], [3.14] ]
    temp_targets = ( "cpu", 79.5, "case", 72.0 )

    [servers]

    [servers.alpha]
    ip = "10.0.0.1"
    role = "frontend"

    [servers.beta]
    ip = "10.0.0.2"
    role = "backend"
    }"""

    data2 = r"""{
    # Ceci est un commentaire TOML

    # Ceci est un commentaire
    # TOML multi-ligne
    str1 = "Je suis une chaîne de caractères."
    str2 = "Vous pouvez me \"citer\"."
    str3 = "Name\tJos\u00E9\nLoc\tSF."

    str3 = "The quick brown fox jumps over the lazy dog."

    path = 'C:\Users\nodejs\templates'
    path2 = '\\User\admin$\system32'
    quoted = 'Tom "Dubs" Preston-Werner'
    regex = '<\i\c*\s*>'

    re = 'I [dw]on't need \d{2} apples'
    }"""

    data3 = """{
    # les entiers
    int1 = +99
    int2 = 42
    int3 = 0
    int4 = -17

    # hexadécimal avec le préfixe `0x`
    hex1 = 0xDEADBEEF
    hex2 = 0xdeadbeef
    hex3 = 0xdead_beef

    # octal avec le préfixe `0o`
    oct1 = 0o01234567
    oct2 = 0o755

    # binaire avec le préfixe `0b`
    bin1 = 0b11010110

    # décimal
    float1 = +1.0
    float2 = 3.1415
    float3 = -0.01

    # exposant
    float4 = 5e+22
    float5 = 1e06
    float6 = -2E-2

    # les deux
    float7 = 6.626e-34

    # les séparateurs
    float8 = 224_617.445_991_228

    # l'infini
    infinite1 = inf # infini positif
    infinite2 = +inf # infini positif
    infinite3 = -inf # infini négatif

    # Not A Number (NaN)
    not1 = nan
    not2 = +nan
    not3 = -nan
    }"""

    data4 = """{
    # date-heure avec décalage
    odt1 = 1979-05-27T07:32:00Z
    odt2 = 1979-05-27T00:32:00-07:00
    odt3 = 1979-05-27T00:32:00.999999-07:00

    # dates-heures local
    ldt1 = 1979-05-27T07:32:00
    ldt2 = 1979-05-27T00:32:00.999999

    # date locale
    [servers]ld1 = 1979-05-27

    # heure locale
    lt1 = 07:32:00
    lt2 = 00:32:00.999999
    temp_targets = { cpu = 79.5, case = 72.0 }
    }"""


    print("Général:\n" + str(find_and_parse_toml(data1)) + "\n")
    print("Chaînes:\n" + str(find_and_parse_toml(data2)))
    print("Nombres:\n" + str(find_and_parse_toml(data3)) + "\n")
    print("Spéciaux:\n" + str(find_and_parse_toml(data4)) + "\n")
