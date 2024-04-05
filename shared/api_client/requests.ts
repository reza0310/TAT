import * as u from './utils';

var ansmap: Map<XMLHttpRequest, string> = new Map<XMLHttpRequest, string>();
var idenmap: Map<XMLHttpRequest, boolean> = new Map<XMLHttpRequest, boolean>();

type cb = (r: XMLHttpRequest) => Promise<void>;

export function request(protocol: string, url: string, data: u.Dictionary<string>, identified: boolean): XMLHttpRequest {
	var xhr = new XMLHttpRequest();
	idenmap.set(xhr, false);
	if (identified) {
		data.username = sessionStorage.getItem("id") as string;
		data.token = sessionStorage.getItem("token") as string;
		idenmap.set(xhr, true);
	}
	xhr.onreadystatechange = function(): void {
		if (this.readyState === this.DONE) {
			if (this.status === 200) {
				ansmap.set(this, this.responseText);
			} else {
				console.warn("HTTP ERROR");
				ansmap.set(this, "HTTP ERROR "+this.status);
			}
		}
	};
	xhr.open(protocol, url);
	xhr.setRequestHeader("Content-Type", "application/json");
	if (data instanceof FormData) {
		xhr.send(u.form_to_json(data));
	} else {
		xhr.send(JSON.stringify(data));
	}
	return xhr;
}

export async function block_until_reception(id: XMLHttpRequest): Promise<void> {
	while (id === undefined || !ansmap.has(id)) {await u.delay(1);}
}

export function receive(id: XMLHttpRequest): [boolean, (string|any)] {
	if (ansmap.has(id)) {
		if (idenmap.get(id)) {
			var res = JSON.parse(ansmap.get(id)!);
			sessionStorage.setItem("token", res.retoken);
			delete res.retoken;
			return [true, res];
		} else {
			return [true, ansmap.get(id)!];
		}
	}
	return [false, ""];
}

export async function receive_blocking(id: XMLHttpRequest): Promise<(string|any)> {
	await block_until_reception(id);
	return receive(id)[1];
}

export async function request_form(protocol: string, url: string, form: HTMLFormElement, callback: cb, identified: boolean): Promise<void> {
	async function cbd(se: SubmitEvent): Promise<void> {
		se.preventDefault();
		var req: XMLHttpRequest = new (request as any)(protocol, url, new FormData(form), identified);
		form.reset();
		await callback(req);
	}
	form.addEventListener("submit", async (se: SubmitEvent) => {await cbd(se);}, true);
}
