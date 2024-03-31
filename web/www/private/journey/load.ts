import * as u from '../../../../shared/api_client/utils';
import * as r from '../../../../shared/api_client/requests';

async function findGetParameter(parameterName: string): Promise<string> {
    var result: string = "";
    var tmp: Array<string> = [];
    location.search
        .substr(1)
        .split("&")
        .forEach(function (item) {
          tmp = item.split("=");
          if (tmp[0] === parameterName) result = decodeURIComponent(tmp[1]);
        });
    return result;
}

(async () => {
	var ide: string = await findGetParameter("journey_id");
	if (ide != null) {
		var req: XMLHttpRequest = new (r.request as any)("GET", u.API_WEBPATH+"/get_journey", {id: ide});
		var res: u.Dictionary<any> = JSON.parse(await r.receive_blocking(req));
		console.log(res);
	}
})();