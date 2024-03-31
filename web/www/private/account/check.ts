import * as u from '../../../../shared/api_client/utils';
import * as r from '../../../../shared/api_client/requests';

(async () => {
	var output: HTMLFormElement = document.getElementById("data")! as HTMLFormElement;
	if (sessionStorage.getItem("id") == null || sessionStorage.getItem("token") == null) {
		output.innerHTML = "<h1>You are not connected</h1>";
	} else {
		var req: XMLHttpRequest = new (r.request as any)("POST", u.API_WEBPATH+"/check_connection", {id: sessionStorage.getItem("id"), token: sessionStorage.getItem("token")});
		var res: any = JSON.parse(await r.receive_blocking(req));
		if (res["result"]! as string == "YES") {
			output.innerHTML = "<h1>You are properly connected</h1>";
		} else {
			output.innerHTML = "<h1>You are badly connected</h1>";
		}
	}
})();