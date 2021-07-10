import {DeliverRequest, InvalidateCacheAndCreateNew} from "./requests";
var axios = require('axios');

global.isAuthenticated = typeof window !== 'undefined' && window.localStorage.getItem("__aSID") !== null;
global.authenticationConnectors = [];

global.accessToken = typeof window !== 'undefined' && window.localStorage.getItem("__aSID") !== null ? window.localStorage.getItem("__aSID") : null;
global.previousLogin = typeof window !== 'undefined' && window.localStorage.getItem("__aPrL") !== null ? JSON.parse(window.localStorage.getItem("__aPrL")) : null;
global.fingerPrint = null;
global.deviceId = null;
global.isInApp = false;
global.loginIdentifier = null;

export async function connectStateToAuth(setState) {
    global.authenticationConnectors.push({connect: setState})
    setState(isAuthenticated);
}

export async function runAuthConnectors() {
    for (const connection in global.authenticationConnectors) {
        if (connection.connect && typeof connection.connect === "function") {
            await connection.connect(true);
        }
    }
}

export async function logout() {
    let x = getPreviousLoginMetadata();
    if (typeof window !== "undefined") {
        window.localStorage.clear();
    }
    global.isAuthenticated = false;
    global.accessToken = null;
    let y = await DeliverRequest({}, "logout", false, 0.001, false);
    InvalidateCacheAndCreateNew();
    if (typeof window !== "undefined") {
        window.localStorage.setItem("__aPrL", JSON.stringify(x))
    }

    await runAuthConnectors();

}

export async function getPreviousLoginMetadata() {
    if (typeof window !== "undefined") {
        return JSON.parse(window.localStorage.getItem("__aPrL"));
    }
}

export async function getFingerPrint() {
    if (typeof window !== "undefined") {
        if (!global.fingerPrint) {

            let FingerprintJS = await import('@fingerprintjs/fingerprintjs');
            let fingerPrinter = await FingerprintJS.load();
            let theFingerPrint = await fingerPrinter.get()
            global.fingerPrint = theFingerPrint.components;
            global.deviceId = theFingerPrint.visitorId;
            return global.fingerPrint;

        } else {
            return global.fingerPrint;
        }
    }
}

export async function getDeviceId() {
    if (!global.fingerPrint || !global.deviceId){
        await getFingerPrint();
    }
    return global.deviceId;
}

export async function getAccessToken() {
    if (typeof window !== "undefined") {
        return window.localStorage.getItem("__aSID");
    }
}

export async function setAccessToken(token) {
    if (typeof window !== "undefined") {
        window.localStorage.setItem("__aSID", token);
    }
    global.accessToken = token;
    global.isAuthenticated = true;
}

export async function hasAccessToken() {
    return await getAccessToken() != null;
}

export async function login(endpoint, data) {

    let token;
    if (typeof window !== 'undefined' && window.localStorage.getItem("__aSID") !== null) {
        token = window.localStorage.getItem("__aSID")
    } else { token = null; }


    const toSend = {
        data: data,
        endpoint: endpoint,
        deviceFingerprint: await getFingerPrint(),
        deviceId: await getDeviceId(),
        token: token
    };

    InvalidateCacheAndCreateNew();

    try {

        return axios.post(global.baseUrl + "auth/", toSend).then(result => {
            if (result.status === 200) {
                if (typeof result.data === "string"){
                    setAccessToken(result.data);
                    if (loginIdentifier) {
                        if (typeof window !== "undefined") {
                            window.localStorage.setItem("__aPrL", JSON.stringify(loginIdentifier));
                        }
                        global.loginIdentifier = loginIdentifier;
                    }

                    InvalidateCacheAndCreateNew();

                    global.viewConnectors.forEach((connection) => {
                        connection.connect();
                    })
                    global.searchConnectors.forEach((connection) => {
                        connection.connect();
                    })

                    runAuthConnectors();
                }
                return { success: true, result: "" }
            }
        }).catch(result => {

            global.authenticationConnectors.forEach((connection) => {
                connection.connect(false);
            })

            if (result.response && result.response.data && result.response.data.errorMessage) {
                return { success: false, result: result.response.data.errorMessage }
            } else if (result.response && result.response.statusText) {
                return { success: false, result: result.response.statusText }
            } else {
                return { success: false, result: "Your internet connection may be offline. Check it and refresh this page."}
            }
        });
    } catch (e) {

        global.authenticationConnectors.forEach((connection) => {
            connection.connect(false);
        })

        return { success: false, result: e }
    }

}
