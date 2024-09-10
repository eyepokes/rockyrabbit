import { request, isJSON } from "./utils";

const headers = {
    "accept": "application/json, text/plain, */*",
    "accept-language": "en-US,en;q=0.8",
    "sec-fetch-dest": "empty",
    "sec-fetch-mode": "cors",
    "sec-fetch-site": "same-site",
    "User-Agent": "Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.6533.64 Mobile Safari/537.36"
}

const host = "https://api.rockyrabbit.io/api/v1";

const errorMessages = [
    "update token",
    "IP banned by cloudflare or captcha",
    "is not a json object",
    
]

export async function config(token: string, proxy: string | false = false) {
    let response = await request("POST", `${host}/config`, {
        ...headers,
        "authorization": `tma ${token}`
    }, proxy);

    if (response.status === 401) {
        throw new Error(errorMessages[0]);
    }

    if (!isJSON(response.data)) {
        if (typeof response.data === "string" && response.data.includes("cloudflare")) {
            throw new Error(errorMessages[1]);
        }
        throw new Error(errorMessages[2]);
    }

    return response.data;
}

export async function tap(token: string, count: number, proxy: string | false = false) {
    let response = await request("POST", `${host}/clicker/tap`, {
        ...headers,
        "authorization": `tma ${token}`
    }, proxy, JSON.stringify({ count }));

    if (response.status === 401) {
        throw new Error(errorMessages[0]);
    }

    if (!isJSON(response.data)) {
        if (typeof response.data === "string" && response.data.includes("cloudflare")) {
            throw new Error(errorMessages[1]);
        }
        throw new Error(errorMessages[2]);
    }

    return response.data;
}

export async function upgrade(token: string, upgradeId: string, proxy: string | false = false) {
    let response = await request("POST", `${host}/mine/upgrade`, {
        ...headers,
        "authorization": `tma ${token}`
    }, proxy, JSON.stringify({ upgradeId }));

    if (response.status === 401) {
        throw new Error(errorMessages[0]);
    }

    if (!isJSON(response.data)) {
        if (typeof response.data === "string" && response.data.includes("cloudflare")) {
            throw new Error(errorMessages[1]);
        }
        throw new Error(errorMessages[2]);
    }

    if (response.data.status === "ok") {
        return true;
    }
    else {
        return false;
    }
}

export async function boost(token: string, boostId: string, proxy: string | false = false) {
    let response = await request("POST", `${host}/boosts`, {
        ...headers,
        "authorization": `tma ${token}`
    }, proxy, JSON.stringify({ boostId, "timezone": "Europe/Moscow" }));

    if (response.status === 401) {
        throw new Error(errorMessages[0]);
    }

    if (!isJSON(response.data)) {
        if (typeof response.data === "string" && response.data.includes("cloudflare")) {
            throw new Error(errorMessages[1]);
        }
        throw new Error(errorMessages[2]);
    }

    if (response.data.status === "ok") {
        return true;
    }
    else {
        return false;
    }
}
