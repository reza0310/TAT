import * as u from './utils';

var ansmap: Map<XMLHttpRequest, string> = new Map<XMLHttpRequest, string>();

type cb = (r: XMLHttpRequest) => Promise<void>;

export function request(protocol: string, url: string, data: u.Dictionary<string>): XMLHttpRequest {
	var xhr = new XMLHttpRequest();
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

export function receive(id: XMLHttpRequest): [boolean, string] {
	if (ansmap.has(id)) {
		return [true, ansmap.get(id)!]
	}
	return [false, ""];
}

export async function receive_blocking(id: XMLHttpRequest): Promise<string> {
	await block_until_reception(id);
	return receive(id)[1];
}

export async function request_form(protocol: string, url: string, form: HTMLFormElement, callback: cb): Promise<void> {
	async function cbd(se: SubmitEvent): Promise<void> {
		se.preventDefault();
		var req: XMLHttpRequest = new (request as any)(protocol, url, new FormData(form));
		form.reset();
		await callback(req);
	}
	form.addEventListener("submit", async (se: SubmitEvent) => {await cbd(se);}, true);
}
