import {DeliverRequest} from "./requests";

export async function SearchRequest(endpoint, connectionParameters, query, count, before, after, shouldBackgroundRefresh, ttlInMinutes, useCacheIfAvailable) {

    let toSend = {};
    toSend.query = query;
    toSend.count = count;
    toSend.endpoint = endpoint;
    toSend.connectionParameters = connectionParameters;

    if (before) {
        toSend.before = before;
    } else if (after) {
        toSend.after = after;
    }

    return DeliverRequest(toSend, "search", shouldBackgroundRefresh, ttlInMinutes, useCacheIfAvailable)

}
