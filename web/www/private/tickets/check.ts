import * as u from '../../../../shared/api_client/utils';
import * as r from '../../../../shared/api_client/requests';

async function refund(id: number) {
	var req: XMLHttpRequest = new (r.request as any)("POST", u.API_WEBPATH+"/refund", {id: id}, true);
	var res: any = await r.receive_blocking(req);
	alert(res["result"]);
	location.reload();
}

// @ts-ignore
window.refund = refund;

(async () => {
	var output: HTMLFormElement = document.getElementById("data")! as HTMLFormElement;
	if (sessionStorage.getItem("id") == null || sessionStorage.getItem("token") == null) {
		output.innerHTML = "<h1>You are not connected</h1>";
	} else {
		var req: XMLHttpRequest = new (r.request as any)("POST", u.API_WEBPATH+"/check_connection", {id: sessionStorage.getItem("id"), token: sessionStorage.getItem("token")}, false);
		var res: any = JSON.parse(await r.receive_blocking(req));
		if (res["result"]! as string == "YES") {
			output.innerHTML = "<h1>You are properly connected</h1>";
			req = new (r.request as any)("POST", u.API_WEBPATH+"/get_my_tickets", {owner: sessionStorage.getItem("id")}, true);
			res = (await r.receive_blocking(req))["result"]!;
			for (var i: number = 0; i < res.length; i++) {
				var content: string = "";
				for (const [key, value] of Object.entries(res[i])) {
					if (!["owner", "id"].includes(key)) {
						let upkey: string = u.capitalize(key);
						content += `<b>${upkey}:</b> ${value}<br>`;
					}
				}
				document.getElementById("ticket_template_content")!.innerHTML = content;
				document.getElementById("data2")!.innerHTML += document.getElementById("ticket_template")!.innerHTML.replace(/id=/g, "class=").replace(/copyx/g, "refund("+res[i].id+")");
			}
		} else {
			output.innerHTML = "<h1>You are badly connected</h1>";
		}
	}
})();