import * as u from '../../../shared/api_client/utils';
import * as r from '../../../shared/api_client/requests';

async function initMap(): Promise<void> {
  const center: google.maps.LatLng = new google.maps.LatLng(55.95251382144358, -3.1877747591836765);
  const map: google.maps.Map = new google.maps.Map(
    document.getElementById("map") as HTMLElement,
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
  
  var req = new (r.request as any)("GET", u.API_WEBPATH+"/get_stations", {});
  var stations: Array<any> = JSON.parse(await r.receive_blocking(req));
  console.log(stations);

  req = new (r.request as any)("GET", u.API_WEBPATH+"/get_trains", {});
  var trains: Array<any> = JSON.parse(await r.receive_blocking(req));
  console.log(trains);

  for (const station of stations) {
	let title: string = station.name;
	let content: string = "<table>";
	content += `<tr><th style="border: 2px solid black;">${title}</th></tr><tr><td style="border: 1px solid black;">`;
	for (const [key, value] of Object.entries(station)) {
		if (!["latitude", "longitude"].includes(key)) {
			let upkey: string = u.capitalize(key);
			content += `<b>${upkey}:</b> ${value}<br>`;
		}
	}
	content += "</tr></td><tr><td style=\"border: 1px solid black;\"><b>Trains in this station:</b><br>";
	for (var i = 0; i < trains.length; i++) {
		if (trains[i].status != "moving" && trains[i].latitude == station.latitude && trains[i].longitude == station.longitude) {
			content += `<center><h4>${trains[i].model}</h4></center><br>`;
			for (const [key, value] of Object.entries(trains[i])) {
				if (!["latitude", "longitude"].includes(key)) {
					let upkey: string = u.capitalize(key);
					content += `<b>${upkey}:</b> ${value}<br>`;
				}
			}
			trains.splice(i, 1);
		}
	}
	content += "</tr></td></table>";
	add_marker("school-solid.svg", title, 1, content, station.latitude, station.longitude);
  }

	for (const train of trains) {
		let title: string = train.model;
		let content: string = "<table>";
		content += `<tr><th style="border: 2px solid black;">${title}</th></tr><tr><td style="border: 1px solid black;">`;
		for (const [key, value] of Object.entries(train)) {
			if (!["latitude", "longitude"].includes(key)) {
				let upkey: string = u.capitalize(key);
				content += `<b>${upkey}:</b> ${value}<br>`;
			}
		}
		content += "</tr></td></table>";
		add_marker("train-solid.svg", title, 0, content, train.latitude, train.longitude);
	}
  
  console.log("MARKERS LOADED");

}

// @ts-ignore
window.initMap = initMap;
console.log("Function declared");