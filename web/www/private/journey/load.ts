import * as u from '../../../../shared/api_client/utils';
import * as r from '../../../../shared/api_client/requests';

async function findGetParameter(parameterName: string): Promise<string> {
    var result: string = "";
    var tmp: Array<string> = [];
    location.search.substr(1).split("&").forEach(function (item) {
		tmp = item.split("=");
		if (tmp[0] === parameterName) result = decodeURIComponent(tmp[1]);
	});
    return result;
}

async function eeeee(id: string): Promise<boolean> {
	var req: XMLHttpRequest = new (r.request as any)("POST", u.API_WEBPATH+"/set_fav_journey", {owner: sessionStorage.getItem("id"), journey: id});
	console.log(await r.receive_blocking(req));
	location.reload();
    return false;
}

async function aaaaa(id: string): Promise<boolean> {
	var req: XMLHttpRequest = new (r.request as any)("POST", u.API_WEBPATH+"/buy_ticket", {owner: sessionStorage.getItem("id"), id: id});
	console.log(await r.receive_blocking(req));
	location.reload();
    return false;
}

window.onload = (): void => {
	(async () => {
		var ide: string = await findGetParameter("journey");
		if (ide != null) {
			var req: XMLHttpRequest = new (r.request as any)("POST", u.API_WEBPATH+"/get_journey", {id: ide});
			var res: u.Dictionary<any> = JSON.parse(await r.receive_blocking(req));
			var template: HTMLElement = document.getElementById("journey_template")!;
			if (!(res.length == 0)) {
				document.getElementById("journey_template_id")!.innerHTML = "Jouney n°" + res[0].id;
				for (const [key, value] of Object.entries(res[0])) {
					if (key != "id") {
						let upkey: string = u.capitalize(key.split("_")[1]);
						document.getElementById("journey_template_"+key.charAt(0))!.innerHTML += `<b>${upkey}:</b> ${value}<br>`;
					}
				}

				if (sessionStorage.getItem("id") == null || sessionStorage.getItem("token") == null) {
					document.getElementById("journey_template_b1")!.hidden = false;
					document.getElementById("journey_template_b1")!.innerHTML = "<h1>You are not connected</h1>";
					document.getElementById("journey_template_b2")!.hidden = true;
				} else {
					req = new (r.request as any)("POST", u.API_WEBPATH+"/check_connection", {id: sessionStorage.getItem("id"), token: sessionStorage.getItem("token")});
					res = JSON.parse(await r.receive_blocking(req));
					if (res["result"]! as string == "YES") {
						req = new (r.request as any)("POST", u.API_WEBPATH+"/get_fav_journey", {owner: sessionStorage.getItem("id"), journey: ide});
						res = JSON.parse(await r.receive_blocking(req));
						document.getElementById("journey_template_b1")!.hidden = true;
						document.getElementById("journey_template_b2")!.hidden = false;
						document.getElementById("journey_template")!.innerHTML = document.getElementById("journey_template")!.innerHTML.replace(/-action-/g, `onclick="eeeee(${ide})"`);
						if (res.result) document.getElementById("journey_template_b2")!.innerHTML = "Click to unfavourite!";
						else document.getElementById("journey_template_b2")!.innerHTML = "Click to favourite!";
						req = new (r.request as any)("POST", u.API_WEBPATH+"/get_available_tickets", {id: ide});
						res = JSON.parse(await r.receive_blocking(req));
						for (var i: number = 0; i < res.length; i++) {
							var content: string = "";
							for (const [key, value] of Object.entries(res[i])) {
								if (!["owner", "journey", "id"].includes(key)) {
									let upkey: string = u.capitalize(key);
									content += `<b>${upkey}:</b> ${value}<br>`;
								}
							}
							document.getElementById("ticket_template_content")!.innerHTML = content;
							document.getElementById("data2")!.innerHTML += document.getElementById("ticket_template")!.innerHTML.replace(/id=/g, "class=").replace(/-action-/g, `onclick="aaaaa(${res[i].id})"`);
						}
					} else {
						document.getElementById("journey_template_b1")!.hidden = false;
						document.getElementById("journey_template_b1")!.innerHTML = "<h1>You are badly connected</h1>";
						document.getElementById("journey_template_b2")!.hidden = true;
					}
				}
				document.getElementById("data")!.innerHTML = template.innerHTML;
			}
		}
	})();
}

// @ts-ignore
window.eeeee = eeeee;

// @ts-ignore
window.aaaaa = aaaaa;