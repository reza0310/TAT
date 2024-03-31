import jsSHA from "jssha";

export const API_WEBPATH = "http://127.0.0.1:8081";
export const WEBSITE_WEBPATH = "https://127.0.0.1/PAGES/f28cd_project/web/www/public";
const SENSIBLE_KEYS = ["mdp", "pass", "password", "mot_de_passe"]

export interface Dictionary<T> {
    [Key: string]: T;
}

export async function delay(ms: number) {
    return new Promise( resolve => setTimeout(resolve, ms) );
}

export function form_to_json(form: FormData): string {
	var object: Dictionary<string> = {};
	form.forEach(function(value: FormDataEntryValue, key: string){
		if (SENSIBLE_KEYS.includes(key)) {
			const digester = new jsSHA("SHA3-512", "TEXT", { encoding: "UTF8", numRounds: 10});
			digester.update(value.toString());
			object[key] = digester.getHash("HEX");
		} else {
			object[key] = value.toString();
		}
	});
	return JSON.stringify(object);
}

export function replace_document(HTML: string): void {
	var newHTML = document.open("text/html", "replace"); 
	newHTML.write(HTML); 
	newHTML.close(); 
}

export function capitalize (str: string, lower: boolean = false): string {
	return (lower ? str.toLowerCase() : str).replace(/(?:^|\s|["'([{])+\S/g, match => match.toUpperCase());
}