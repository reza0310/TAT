import * as u from '../../../../shared/api_client/utils';
import * as r from '../../../../shared/api_client/requests';

async function eeeee(id: string): Promise<boolean> {
	var req: XMLHttpRequest = new (r.request as any)("POST", u.API_WEBPATH+"/set_fav_journey", {owner: sessionStorage.getItem("id"), journey: id}, true);
	console.log(await r.receive_blocking(req));
	location.reload();
    return false;
}

async function journ(ide: number): Promise<string> {
	var req: XMLHttpRequest = new (r.request as any)("POST", u.API_WEBPATH+"/get_journey", {id: ide}, false);
	var res: u.Dictionary<any> = JSON.parse(await r.receive_blocking(req))["result"];
	if (!(res.length == 0)) {
		document.getElementById("journey_template_id")!.innerHTML = "Jouney n°" + res[0].id;
		document.getElementById("journey_template_d")!.innerHTML = "";
		document.getElementById("journey_template_t")!.innerHTML = "";
		document.getElementById("journey_template_a")!.innerHTML = "";
		for (const [key, value] of Object.entries(res[0])) {
			if (key != "id") {
				let upkey: string = u.capitalize(key.split("_")[1]);
				document.getElementById("journey_template_"+key.charAt(0))!.innerHTML += `<b>${upkey}:</b> ${value}<br>`;
			}
		}

		document.getElementById("journey_template_b1")!.hidden = true;
		document.getElementById("journey_template_b2")!.hidden = false;
		document.getElementById("journey_template_b2")!.innerHTML = "Click to unfavourite!";
		return document.getElementById("journey_template")!.innerHTML.replace(/id=/g, "class=").replace(/-action-/g, `onclick="eeeee(${res[0].id})"`);
	} else {
		return "ERROR";
	}
}

(async () => {
	var output: HTMLFormElement = document.getElementById("tables")! as HTMLFormElement;
	if (sessionStorage.getItem("id") == null || sessionStorage.getItem("token") == null) {
		output.innerHTML = "<h1>You are not connected</h1><br>";
	} else {
		var req: XMLHttpRequest = new (r.request as any)("POST", u.API_WEBPATH+"/check_connection", {id: sessionStorage.getItem("id"), token: sessionStorage.getItem("token")}, false);
		var res: any = JSON.parse(await r.receive_blocking(req));
		if (res["result"]! as string == "YES") {
			output.innerHTML = "<h1>You are properly connected</h1><br>";
		} else {
			output.innerHTML = "<h1>You are badly connected</h1><br>";
		}
		req = new (r.request as any)("POST", u.API_WEBPATH+"/get_fav_journeys", {owner: sessionStorage.getItem("id")}, true);
		var rez: Array<u.Dictionary<any>> = (await r.receive_blocking(req))["result"]!;
		for (var i = 0; i < rez.length; i++) {
			output.innerHTML += await journ(rez[i].journey);
		}
		document.getElementsByTagName("main")[0].style.cssText = "margin-bottom: " + 14*rez.length + "em;";
	}
})();

// @ts-ignore
window.eeeee = eeeee;