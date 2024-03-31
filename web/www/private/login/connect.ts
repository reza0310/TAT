import * as u from '../../../../shared/api_client/utils';
import * as r from '../../../../shared/api_client/requests';

async function treat_result(request: XMLHttpRequest): Promise<void> {
	var result: string = await r.receive_blocking(request);
	var res: any = JSON.parse(result);
	var out: string = res["result"]! as string;
	if (out == "CONNECTION SUCCESS") {
		sessionStorage.setItem("id", res["id"]!);
		sessionStorage.setItem("token", res["token"]!);
		var req: XMLHttpRequest = new (r.request as any)("GET", u.WEBSITE_WEBPATH+"/login/success.html", {});
	} else {
		console.log(out);
		var req: XMLHttpRequest = new (r.request as any)("GET", u.WEBSITE_WEBPATH+"/login/error.html", {});
	}
	u.replace_document(await r.receive_blocking(req));
}

window.onload = (): void => {
	(async () => {
		await r.request_form("POST", u.API_WEBPATH+"/connect", document.getElementById("form")! as HTMLFormElement, treat_result);
	})();
}
