import {
    config,
    tap,
    upgrade,
    boost
} from "./rockyrabbit";
import { ProxyConfig } from "./types";
import { generateRandomNumber, sleep, getProxyUrl } from "./utils";

(async () => {
    const tokens = [
        ""
    ];

    /* const proxy = getProxyUrl({
        protocol: "http",
        host: "109.252.75.100",
        port: 8080,
        auth: {
            username: "r00t",
            password: "r00t"
        }
    }); */
    const proxy = false;


    const minTap = 25;
    const maxTap = 40;
    const timeout = 5 * 60;

    let jobs = [];
    for (const token of tokens) {
        jobs.push(job(token));
    }

    Promise.allSettled(jobs);

    async function job(token: string) {
        try {
            console.log(`job() :: get config`);
            const appConfig = await config(token, proxy);
            if (!appConfig) {
                console.log("job() :: token expired");
                return;
            }

            // boost section
            const boosts = appConfig.config.boosts;
            for (const item of boosts.filter((item: any) => !["full-available-taps", "turbo"].includes(item.boostId))) {
                let boostResponse = await boost(token, item.boostId, proxy);
                if (boostResponse) {
                    console.log(`job() :: boost ${item.boostId} success`);
                }
                else {
                    console.log(`job() :: boost ${item.boostId} failed`);
                }
                await sleep(generateRandomNumber(0.5, 1.5, true));
            }

            // upgrade section
            const upgrades = appConfig.config.upgrade;
            const upgradeStats = [0, 0];
            for (const item of upgrades) {
                let upgradeResponse = await upgrade(token, item.upgradeId, proxy);
                upgradeStats[upgradeResponse ? 0 : 1]++;
                await sleep(generateRandomNumber(0.5, 1.5, true));
            }
            console.log(`job() :: upgrade stats: ${upgradeStats[0]} success / ${upgradeStats[1]} failed`);

            // tap section
            let tapResponse = await tap(token, generateRandomNumber(minTap, maxTap));
            let availableTaps = tapResponse.clicker.availableTaps;
            // turbo boost if available
            let boostResponse = await boost(token, "turbo", proxy);
            if (boostResponse) {
                console.log(`job() :: turbo boost success`);
            }
            else {
                console.log(`job() :: turbo boost failed`);
            }
            let onceFullAvailableTaps = false;
            while (availableTaps > 20) {
                console.log(`job() :: available taps: ${availableTaps}`);
                let tapCount = generateRandomNumber(minTap, maxTap);
                tapResponse = await tap(token, tapCount > availableTaps ? availableTaps : tapCount, proxy);
                availableTaps = tapResponse.clicker.availableTaps;
                // full-available-taps boost if available
                if (!onceFullAvailableTaps && availableTaps < 50) {
                    boostResponse = await boost(token, "full-available-taps", proxy);
                    if (boostResponse) {
                        console.log(`job() :: full-available-taps boost success`);
                        tapResponse = await tap(token, availableTaps, proxy);
                        availableTaps = tapResponse.clicker.availableTaps;
                    }
                    else {
                        console.log(`job() :: full-available-taps boost failed`);
                    }
                    onceFullAvailableTaps = true;
                }

                await sleep(generateRandomNumber(1, 2));
            }


            console.log(`job() :: taps done, sleep ${timeout}s`);
            await sleep(timeout);
            console.log(`job() :: sleep done, start new job`);
            await job(token);
        } catch (e: any) {
            console.log(`job :: error occurred: ${e.message}`);
        }
    }
})();
