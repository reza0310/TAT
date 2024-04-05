import * as u from '../../../shared/api_client/utils';
import * as r from '../../../shared/api_client/requests';

// @ts-ignore
window.initMap = initMap;

async function initMap(): Promise<void> {
	while(typeof initMap_wrapped !== "function") {  // https://stackoverflow.com/questions/53738478/javascript-wait-until-function-is-defined
		await u.delay(500);
	}
	console.log("Function declared");
	return await initMap_wrapped();
}

console.log("Wrapper declared");

async function initMap_wrapped(): Promise<void> {
	const center: google.maps.LatLng = new google.maps.LatLng(55.95251382144358, -3.1877747591836765);
	const map: google.maps.Map = new google.maps.Map(document.getElementById("map") as HTMLElement,
		{
		  zoom: 9,
		  center: center,
		  zoomControl: false,
		  mapTypeControl: false,
		  scaleControl: false,
		  streetViewControl: false,
		  rotateControl: false,
		  fullscreenControl: true,
		  styles: [
				{
					featureType: "poi",
					elementType: "labels",
					stylers: [
						  { visibility: "off" }
					]
				},
				{
				  featureType: "transit",
				  elementType: "labels.icon",
				  stylers: [{ visibility: "off" }],
				}
			]
		}
	);
	console.log("MAP LOADED");

	function add_marker(icon_url: string, title: string, ind: number, content: string, latitude: number, longitude: number): void {
		const infowindow = new google.maps.InfoWindow({
			content: content,
			ariaLabel: title
		});

		const marker = new google.maps.Marker({
			position: new google.maps.LatLng(latitude, longitude),
			icon: {
				url: icon_url,
				scaledSize: new google.maps.Size(50, 50)
			},
			map: map,
			title: title,
			optimized: false,
			zIndex: ind
		});

		marker.addListener("click", () => {
			infowindow.open({
				anchor: marker,
				map: map,
			});
		});
	}
  
	var req: XMLHttpRequest = new (r.request as any)("GET", u.API_WEBPATH+"/get_stations", {}, false);
	var stations: Array<u.Dictionary<any>> = JSON.parse(await r.receive_blocking(req))["result"];

	req = new (r.request as any)("GET", u.API_WEBPATH+"/get_trains", {}, false);
	var trains: Array<u.Dictionary<any>> = JSON.parse(await r.receive_blocking(req))["result"];

	for (const station of stations) {
		let title: string = station.name;
		let template1: HTMLElement = document.getElementById("stations_template")!;
		document.getElementById("stations_template_title")!.innerHTML = title;
		let content: string = "";
		for (const [key, value] of Object.entries(station)) {
			if (!["latitude", "longitude"].includes(key)) {
				let upkey: string = u.capitalize(key);
				content += `<b>${upkey}:</b> ${value}<br>`;
			}
		}
		document.getElementById("stations_template_content")!.innerHTML = content;
		document.getElementById("stations_template_trains")!.innerHTML = "";
		for (var i = 0; i < trains.length; i++) {
			if (trains[i].status != "moving" && trains[i].latitude == station.latitude && trains[i].longitude == station.longitude) {
				let template2: HTMLElement = document.getElementById("trains_in_station_template")!;
				document.getElementById("trains_in_station_template_title")!.innerHTML = trains[i].model + " " + trains[i].id;
				content = "";
				for (const [key, value] of Object.entries(trains[i])) {
					if (key == "lateness") {
						if (value.search(/early/i) != -1) content += "<div style=\"background-color: yellow;\">";
						else if (value.search(/late/i) != -1) content += "<div style=\"background-color: red;\">";
						else content += "<div style=\"background-color: green;\">";
					}
					if (!["latitude", "longitude", "id"].includes(key)) {
						let upkey: string = u.capitalize(key);
						content += `<b>${upkey}:</b> ${value}<br>`;
					}
					if (key == "lateness") content += "</div>";
				}
				document.getElementById("trains_in_station_template_content")!.innerHTML = content;
				req = new (r.request as any)("POST", u.API_WEBPATH+"/get_next_journey", {id: trains[i].id}, false);
				var res: u.Dictionary<any> = JSON.parse(await r.receive_blocking(req))["result"];
				// @ts-ignore
				document.getElementById("trains_in_station_template_next_journey").href = u.WEBSITE_WEBPATH + "/journey/?journey=" + res[0].id;
				document.getElementById("stations_template_trains")!.innerHTML += template2.innerHTML.replace(/copyx/g, "copy("+trains[i].id+")");
				trains.splice(i, 1);
			}
		}
		add_marker("school-solid.svg", title, 1, template1.innerHTML.replace(/id=/g, "class="), station.latitude, station.longitude);
	}

	for (const train of trains) {
		let title: string = train.model + " " + train.id;
		let template3: HTMLElement = document.getElementById("trains_template")!;
		document.getElementById("trains_template_title")!.innerHTML = title;
		let content: string = "";
		for (const [key, value] of Object.entries(train)) {
			if (key == "lateness") {
				if (value.search(/early/i) != -1) content += "<div style=\"background-color: yellow;\">";
				else if (value.search(/late/i) != -1) content += "<div style=\"background-color: red;\">";
				else content += "<div style=\"background-color: green;\">";
			}
			if (!["latitude", "longitude", "id"].includes(key)) {
				let upkey: string = u.capitalize(key);
				content += `<b>${upkey}:</b> ${value}<br>`;
			}
			if (key == "lateness") content += "</div>";
		}
		document.getElementById("trains_template_content")!.innerHTML = content;
		req = new (r.request as any)("POST", u.API_WEBPATH+"/get_next_journey", {id: train.id}, false);
		var res: u.Dictionary<any> = JSON.parse(await r.receive_blocking(req))["result"];
		// @ts-ignore
		document.getElementById("trains_template_next_journey").href = u.WEBSITE_WEBPATH + "/journey/?journey=" + res[0].id
		add_marker("train-solid.svg", title, 0, template3.innerHTML.replace(/id=/g, "class=").replace(/copyx/g, "copy("+train.id+")"), train.latitude, train.longitude);
	}
	console.log("MARKERS LOADED");
}