import * as u from '../../../../shared/api_client/utils';
import * as r from '../../../../shared/api_client/requests';

async function treat_result(request: XMLHttpRequest): Promise<void> {
	var result: string = await r.receive_blocking(request);
	var res: any = JSON.parse(result);
	var out: string = res["result"]! as string;
	if (out == "CONNECTION SUCCESS") {
		sessionStorage.setItem("id", res["id"]!);
		sessionStorage.setItem("token", res["token"]!);
		var rr: string = "Connection successful!";
		await switch_to(true);
	} else {
		var rr: string = "Connection failed!";
	}
	document.getElementById("result")!.innerHTML = rr;
}

async function switch_to(val: boolean): Promise<void> {
	if (val) {
		document.getElementById("container1")!.hidden = true;
		document.getElementById("container2")!.hidden = false;
		document.getElementById("deco")!.onclick = async function() { 
			sessionStorage.removeItem("id");
			sessionStorage.removeItem("token");
			document.getElementById("result")!.innerHTML = "Disconnection successful!";
			await switch_to(false);
			return false;
		};
	} else {
		document.getElementById("container1")!.hidden = false;
		document.getElementById("container2")!.hidden = true;
	}
}

window.onload = (): void => {
	(async () => {
		await switch_to(false);
		if (sessionStorage.getItem("id") == null || sessionStorage.getItem("token") == null) {
			await r.request_form("POST", u.API_WEBPATH+"/connect", document.getElementById("form")! as HTMLFormElement, treat_result, false);
		} else {
			var req: XMLHttpRequest = new (r.request as any)("POST", u.API_WEBPATH+"/check_connection", {id: sessionStorage.getItem("id"), token: sessionStorage.getItem("token")}, false);
			var res: any = JSON.parse(await r.receive_blocking(req));
			if (res["result"]! as string == "YES") {
				await switch_to(true);
			} else {
				await r.request_form("POST", u.API_WEBPATH+"/connect", document.getElementById("form")! as HTMLFormElement, treat_result, false);
			}
		}
	})();
}
