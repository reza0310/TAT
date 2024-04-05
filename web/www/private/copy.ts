import * as u from '../../../shared/api_client/utils';
import * as r from '../../../shared/api_client/requests';

// @ts-ignore
window.copy = copy;

async function copy(id: number) {
	var req: XMLHttpRequest = new (r.request as any)("GET", u.API_WEBPATH+"/get_trains", {});
	var trains: Array<any> = JSON.parse(await r.receive_blocking(req));
	for (const train of trains) {
		if (train.id == id) {
			try {
				navigator.clipboard.writeText(JSON.stringify(train));
				alert("Copy successfully done");
			} catch {
				navigator.permissions.query({ name: "clipboard-write" }).then((result) => {
					if (result.state === "granted" || result.state === "prompt") {
						navigator.clipboard.writeText(JSON.stringify(train));
						alert("Copy successfully done");
					}
				});
			}
		}
	}
}