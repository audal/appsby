import {DeliverRequest} from "./requests";

export async function APIRequest(endpoint, connectionParameters, data) {

    let toSend = {};
    toSend.data = data;
    toSend.endpoint = endpoint;
    toSend.connectionParameters = connectionParameters;

    return DeliverRequest(toSend, "api", false, 0.01, false)

}


export async function AppsbyRequest (endpoint, connectionParameters, data) { return  APIRequest(endpoint, connectionParameters, data) };
