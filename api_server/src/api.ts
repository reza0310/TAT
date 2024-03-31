import * as http from 'http';

const HEADERS = {'Content-Type': 'application/json',
				'Access-Control-Allow-Origin': '*',
				'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
				'Access-Control-Allow-Headers': '*'}

export class APIRequest {
    req: http.IncomingMessage;
    url: URL;
    data: any;

    public constructor(req: http.IncomingMessage, url: URL, data: any) {
        this.req = req;
        this.url = url;
        this.data = data;
    }
}

export class APIResponse {
    rep: http.ServerResponse;

    public constructor(rep: http.ServerResponse) {
        this.rep = rep;
    }

    public send(data: any, code: number = 200) {
        this.rep.writeHead(code, HEADERS);
        this.rep.write(JSON.stringify(data));
        this.rep.end();
    }
}

export type APICallback = (req: APIRequest, rep: APIResponse) => void;

export class API {
    server: http.Server;
    endpoints: Map<string, Map<string, APICallback>>;
    port: number;
    host: string;

    public constructor(host: string, port: number) {
        this.server = http.createServer();
        this.endpoints = new Map();
        this.port = port;
        this.host = host;
    }

    private handle_request(req: http.IncomingMessage, rep: http.ServerResponse, data: any) {
        if (req.url === undefined) return;
        let url = new URL(req.url, "http://" + req.headers.host);
        let method = req.method;
        let paths = this.endpoints.get(method!.toUpperCase());
        let cb = (paths !== undefined) ? paths.get(url.pathname) : undefined;
		if (method != "OPTIONS") console.log("Received request "+url.pathname);
        if (cb === undefined) {
            rep.writeHead(404, HEADERS);
            rep.write(JSON.stringify({"error": "unknown endpoint"}));
            rep.end();
            return;
        }
        cb(new APIRequest(req, url, data), new APIResponse(rep))
    }

    public run() {
        this.server.addListener("request", (req, rep) => {
            let body: Uint8Array[] = [];

            req.on('data', (chunk) => {
                body.push(chunk);
            });

            req.on('end', () => {
                try {
                    let str = Buffer.concat(body).toString('utf8');
                    let data = (str === "") ? null : JSON.parse(str);
                    this.handle_request(req, rep, data);
                } catch (error) {
                    console.warn(error);
                    rep.writeHead(400, HEADERS);
                    rep.write(JSON.stringify({"error": "failed to parse json body"}));
                    rep.end();
                }
            });
        });

        this.server.addListener("connection", (sock) => {
            let addr = sock.address() as any;
            console.log("New client connected on '" + addr["address"] + "' and port " + addr['port']);
        });

        this.server.listen(this.port, this.host);
    }

    public get(path: string, cb: APICallback) {
        this.on("OPTIONS", path, async (req: APIRequest, rep: APIResponse) => {rep.send({});});
        this.on("GET", path, cb);
    }

    public post(path: string, cb: APICallback) {
        this.on("OPTIONS", path, async (req: APIRequest, rep: APIResponse) => {rep.send({});});
        this.on("POST", path, cb);
    }

    public on(method: string, path: string, cb: APICallback) {
        method = method.toUpperCase();
        let paths = this.endpoints.get(method);
        if (paths === undefined) {
            paths = new Map();
            this.endpoints.set(method, paths);
        }
        paths.set(path, cb);
    }
}
