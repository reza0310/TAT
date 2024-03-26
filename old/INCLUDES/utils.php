<?php
include "config.php";
include "mdp.php";


function addheader($content, $navid) {
	$ret = file_get_contents("header.html", true);
	$ret = str_replace($navid, "active", $ret);
	$ret = str_replace("%php%", $content, $ret);
	$ret = str_replace("%basedir%", BASEDIR, $ret);
	return $ret;
}


function dbconnect() {
	try {
		$con = new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME, DB_PORT);
		return $con;
	} catch (Exception $e) {
		http_response_code(500);
		exit("Failed to connect to DB");
	}
}


function clearhtml($str) {
	return clearmulti($str, array("<", "&lt;", ">", "&gt;"));
}


function checkurl($str) {
	if (strlen($str) < 5) {
		return "";
	}
	return "http".substr(clearmulti($str, array("'", "%27", "\\", "%5C", '"', "%22", " ", "%20")), 4);
}


function clearmulti($str, $liste) {
	if ($str == null) {
		return '';
	}
	$sortie = "";
	foreach(str_split($str) as $lettre) {
		$replaced = false;
		for($i = 0; $i < count($liste); $i += 2) {
			if ($lettre == $liste[$i]) {
				$sortie .= $liste[$i+1];
				$replaced = true;
			}
		}
		if (!$replaced) {
			$sortie .= $lettre;
		}
	}
	return $sortie;
}
?>