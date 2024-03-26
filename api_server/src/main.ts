import * as bcrypt from 'bcrypt';

import * as api from './api';
import * as db from './db';

const port: number = 8081;
const host: string = "127.0.0.1";

const server: api.API = new api.API(host, port);

server.get("/version", async (req: api.APIRequest, rep: api.APIResponse) => {
    rep.send({"version": "1.0.0"});
});

server.post("/ping", async (req: api.APIRequest, rep: api.APIResponse) => {
    rep.send({"data": req.data});
});

server.post("/register", async (req: api.APIRequest, rep: api.APIResponse) => {
	var tmp;
	if (req.data != null && (!("mail" in req.data) || !("nom" in req.data) || !("mdp" in req.data))) {
		rep.send({"result": "INVALID REQUEST ERROR"});
	} else {
		tmp = await db.query("SELECT * FROM comptes WHERE nom=?", [req.data["nom"]])
		if (tmp.toString() == [].toString()) {
			const hash: string = await bcrypt.hash(req.data["mdp"], 12)
			tmp = await db.query("INSERT INTO comptes (nom, mail, hash) VALUES (?, ?, ?)", [req.data["nom"], req.data["mail"], hash])
			rep.send({"result": "ACCOUNT CREATION SUCCESS"});
		} else {
			console.log("Unable to create account ");
			rep.send({"result": "ACCOUNT ALREADY EXISTS ERROR"});
		}
	}
});

server.post("/connect", async (req: api.APIRequest, rep: api.APIResponse) => {
	var tmp;
	if (req.data != null && (!("nom" in req.data) || !("mdp" in req.data))) {
		rep.send({"result": "INVALID REQUEST ERROR"});
	} else {
		tmp = await db.query("SELECT * FROM comptes WHERE nom=?", [req.data["nom"]])
		if (tmp.toString() == [].toString()) {
			rep.send({"result": "NO ACCOUNT FOUND ERROR"});
		} else {
			if (await bcrypt.compare(req.data["mdp"], tmp[0]["hash"])) {
				rep.send({"result": "ACCOUNT FOUND"});
			} else {
				rep.send({"result": "BAD PASSWORD"});
			}
		}
	}
});

server.run()

console.log("Server started");
