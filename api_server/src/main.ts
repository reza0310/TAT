import * as bcrypt from 'bcrypt';

import * as api from './api';
import * as db from './db';

const port: number = 8081;
const host: string = "127.0.0.1";

const server: api.API = new api.API(host, port);

function makeid(length: number): string {  // https://stackoverflow.com/questions/1349404/generate-random-string-characters-in-javascript
    let result: string = '';
    const characters: string = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const charactersLength: number = characters.length;
    let counter: number = 0;
    while (counter < length) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
      counter += 1;
    }
    return result;
}

server.get("/version", async (req: api.APIRequest, rep: api.APIResponse) => {
    rep.send({"version": "1.0.0"});
});

server.post("/ping", async (req: api.APIRequest, rep: api.APIResponse) => {
    rep.send({"data": req.data});
});

server.post("/register", async (req: api.APIRequest, rep: api.APIResponse) => {
	var tmp;
	if (req.data != null && (!("username" in req.data) || !("password" in req.data))) {
		rep.send({"result": "INVALID REQUEST ERROR"});
	} else {
		tmp = await db.query("SELECT * FROM accounts WHERE id=?", [req.data["username"]]);
		if (tmp.toString() == [].toString()) {
			const hash: string = await bcrypt.hash(req.data["password"], 12);
			const token: string = makeid(100);
			const token_valid: Date = new Date();
			tmp = await db.query("INSERT INTO accounts (id, digested_password_hash, role, token, token_validity) VALUES (?, ?, 1, ?, ?)", [req.data["username"], hash, token, token_valid]);
			rep.send({"result": "ACCOUNT CREATION SUCCESS", "id": req.data["username"], "token": token, "validity": token_valid});
		} else {
			console.log("Unable to create account ");
			rep.send({"result": "ACCOUNT ALREADY EXISTS ERROR"});
		}
	}
});

server.post("/check_connection", async (req: api.APIRequest, rep: api.APIResponse) => {
	var tmp;
	if (req.data != null && (!("id" in req.data) || !("token" in req.data))) {
		rep.send({"result": "INVALID REQUEST ERROR"});
	} else {
		tmp = await db.query("SELECT * FROM accounts WHERE id=? AND token=?", [req.data["id"], req.data["token"]]);
		if (tmp.toString() == [].toString()) {
			rep.send({"result": "NO"});
		} else {
			rep.send({"result": "YES"});
		}
	}
});

server.post("/connect", async (req: api.APIRequest, rep: api.APIResponse) => {
	var tmp;
	if (req.data != null && (!("username" in req.data) || !("password" in req.data))) {
		rep.send({"result": "INVALID REQUEST ERROR"});
	} else {
		tmp = await db.query("SELECT * FROM accounts WHERE id=?", [req.data["username"]]);
		if (tmp.toString() == [].toString()) {
			rep.send({"result": "ACCOUNT NOT FOUND"});
		} else {
			if (await bcrypt.compare(req.data["password"], tmp[0]["digested_password_hash"])) {
				const token: string = makeid(100);
				const token_valid: Date = new Date();
				tmp = await db.query("UPDATE accounts SET token=?, token_validity=? WHERE id=?", [token, token_valid, req.data["username"]]);
				rep.send({"result": "CONNECTION SUCCESS", "id": req.data["username"], "token": token, "validity": token_valid});
			} else {
				rep.send({"result": "BAD PASSWORD"});
			}
		}
	}
});

server.get("/get_stations", async (req: api.APIRequest, rep: api.APIResponse) => {
	var tmp = await db.query("SELECT name, address, latitude, longitude FROM stations", []);
	var results = tmp.map((v: any[]) => Object.assign({}, v));
	rep.send(results);
});

server.get("/get_trains", async (req: api.APIRequest, rep: api.APIResponse) => {
	var tmp = await db.query("SELECT t.id, t.capacity, t.model, t.owner, s.name AS status, t.latitude, t.longitude FROM trains t JOIN status_enum s ON t.status = s.id", []);
	var results = tmp.map((v: any[]) => Object.assign({}, v));
	rep.send(results);
});

server.post("/get_journey", async (req: api.APIRequest, rep: api.APIResponse) => {
	if (req.data != null && (!("id" in req.data))) {
		console.log(req);
		rep.send({"result": "INVALID REQUEST ERROR"});
	} else {
		var tmp = await db.query("SELECT j.id, j.departure_time, j.arrival_time, t.capacity AS train_capacity, t.model AS train_model, t.owner AS train_owner, st.name AS train_status, t.latitude AS train_latitude, t.longitude AS train_longitude, s.name AS departure_name, s.address AS departure_address, s.latitude AS departure_latitude, s.longitude AS departure_longitude, s2.name AS arrival_name, s2.address AS arrival_address, s2.latitude AS arrival_latitude, s.longitude AS arrival_longitude FROM journeys j JOIN trains t ON j.train=t.id JOIN status_enum st ON t.status=st.id JOIN stations s ON j.departure_station=s.id JOIN stations s2 ON j.arrival_station=s2.id WHERE j.id=?", [req.data["id"]]);
		var results = tmp.map((v: any[]) => Object.assign({}, v));
		rep.send(results);
	}
});

server.post("/get_next_journey", async (req: api.APIRequest, rep: api.APIResponse) => {
	if (req.data != null && (!("id" in req.data))) {
		rep.send({"result": "INVALID REQUEST ERROR"});
	} else {
		var tmp = await db.query("SELECT id FROM journeys WHERE departure_time>? AND train=? LIMIT 1", [new Date(), req.data["id"]]);
		var results = tmp.map((v: any[]) => Object.assign({}, v));
		rep.send(results);
	}
});

server.post("/get_fav_journey", async (req: api.APIRequest, rep: api.APIResponse) => {
	if (req.data != null && (!("owner" in req.data)) && (!("journey" in req.data))) {
		rep.send({"result": "INVALID REQUEST ERROR"});
	} else {
		var tmp = await db.query("SELECT * FROM saved_journeys WHERE owner=? AND journey=?", [req.data["owner"], req.data["journey"]]);
		if (tmp.toString() == [].toString()) {
			rep.send({result: false});
		} else {
			rep.send({result: true});
		}
	}
});

server.post("/get_fav_journeys", async (req: api.APIRequest, rep: api.APIResponse) => {
	if (req.data != null && (!("owner" in req.data))) {
		rep.send({"result": "INVALID REQUEST ERROR"});
	} else {
		var tmp = await db.query("SELECT * FROM saved_journeys WHERE owner=?", [req.data["owner"]]);
		var results = tmp.map((v: any[]) => Object.assign({}, v));
		rep.send(results);
	}
});

server.post("/set_fav_journey", async (req: api.APIRequest, rep: api.APIResponse) => {
	if (req.data != null && (!("owner" in req.data)) && (!("journey" in req.data))) {
		rep.send({"result": "INVALID REQUEST ERROR"});
	} else {
		var tmp = await db.query("SELECT * FROM saved_journeys WHERE owner=? AND journey=?", [req.data["owner"], req.data["journey"]]);
		if (tmp.toString() == [].toString()) {
			tmp = await db.query("INSERT INTO saved_journeys (owner, journey) VALUES (?, ?)", [req.data["owner"], req.data["journey"]]);
			rep.send({result: "OK"});
		} else {
			tmp = await db.query("DELETE FROM saved_journeys WHERE owner=? AND journey=?", [req.data["owner"], req.data["journey"]]);
			rep.send({result: "OK"});
		}
	}
});

server.post("/get_available_tickets", async (req: api.APIRequest, rep: api.APIResponse) => {
	if (req.data != null && (!("id" in req.data))) {
		console.log(req);
		rep.send({"result": "INVALID REQUEST ERROR"});
	} else {
		var tmp = await db.query("SELECT * FROM tickets WHERE journey=? AND owner IS NULL", [req.data["id"]]);
		var results = tmp.map((v: any[]) => Object.assign({}, v));
		rep.send(results);
	}
});

server.post("/buy_ticket", async (req: api.APIRequest, rep: api.APIResponse) => {
	if (req.data != null && (!("owner" in req.data)) && (!("id" in req.data))) {
		rep.send({"result": "INVALID REQUEST ERROR"});
	} else {
		var tmp = await db.query("SELECT * FROM tickets WHERE id=? AND owner IS NULL", [req.data["id"]]);
		if (tmp.toString() == [].toString()) {
			rep.send({result: "TOO LATE"});
		} else {
			tmp = await db.query("UPDATE tickets SET owner=? WHERE id=?", [req.data["owner"], req.data["id"]]);
			rep.send({result: "OK"});
		}
	}
});

server.post("/get_my_tickets", async (req: api.APIRequest, rep: api.APIResponse) => {
	if (req.data != null && (!("owner" in req.data))) {
		rep.send({"result": "INVALID REQUEST ERROR"});
	} else {
		var tmp = await db.query("SELECT * FROM tickets WHERE owner=?", [req.data["owner"]]);
		var results = tmp.map((v: any[]) => Object.assign({}, v));
		rep.send(results);
	}
});

server.run()

console.log("Server started");
