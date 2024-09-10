import axios, { AxiosRequestConfig } from "axios";
import { HttpsProxyAgent } from "https-proxy-agent";
import { ProxyConfig, RequestMethod } from "./types";

export async function request(method: RequestMethod, path: string, headers: any, proxy: ProxyConfig | string | false = false, data: any | false = false, body: any | false = false, retry: boolean = true): Promise<any> {
    //console.log(`${method} ${path}, ${retry}`);

    let requestOptions: AxiosRequestConfig = {
        method: method,
        url: path,
        headers,
        validateStatus: () => true,
        ...(data && { data }),
        ...(body && { body })
    };

    if (proxy) {
        requestOptions.httpsAgent = new HttpsProxyAgent(proxy as any);
    }

    return await axios.request(requestOptions).catch(async (error) => {
        console.log(`request(${method}, ${path}, ${retry}) - ${error.message}`);
        if (retry) {
            await sleep(5);
            return await request(method, path, headers, proxy, data, body, false);
        }

        throw error;
    });
}

export async function sleep(seconds: number) {
    return new Promise(resolve => setTimeout(resolve, seconds * 1000));
}

export function generateRandomNumber(min: number, max: number, isFloat: boolean = false): number {
    // Ensure min is less than max
    if (min > max) {
        [min, max] = [max, min];
    }

    // Generate and return the random number
    let randomNumber = Math.random() * (max - min) + min;
    return isFloat ? Number((randomNumber).toFixed(2)) : Math.floor(randomNumber);
}

export function getProxyUrl(proxy: ProxyConfig): string {

    if (!proxy.auth) {
        return `${proxy.protocol}://${proxy.host}:${proxy.port}`;
    }

    return `${proxy.protocol}://${proxy.auth.username}:${proxy.auth.password}@${proxy.host}:${proxy.port}`;
}

export function isJSON(value: unknown): boolean {
    if (typeof value !== 'object' || value === null) {
        return false;
    }

    try {
        JSON.parse(JSON.stringify(value));
        return true;
    } catch (error) {
        return false;
    }
}