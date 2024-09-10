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
        "user=%7B%22id%22%3A193029817%2C%22first_name%22%3A%22%D0%9C%D0%B0%D1%81%D1%82%D0%B5%D1%80%22%2C%22last_name%22%3A%22%D0%A7%D0%B0%D0%BD%D0%B3%22%2C%22username%22%3A%22malefique%22%2C%22language_code%22%3A%22en%22%2C%22allows_write_to_pm%22%3Atrue%7D&chat_instance=-6116608369668720528&chat_type=sender&auth_date=1725870352&hash=3ed456a07dc11dc6a59faf86f79c52f3df0623702d5fc1743f85e156819e1b2e",
        /* "query_id=AAFrLsA5AgAAAGsuwDnDlb6f&user=%7B%22id%22%3A5263863403%2C%22first_name%22%3A%22S%22%2C%22last_name%22%3A%22%22%2C%22language_code%22%3A%22en%22%2C%22allows_write_to_pm%22%3Atrue%7D&auth_date=1725870453&hash=e0c4d09f9490fe0b60c47c041277e3ce26597c1e95c7c18e402b883cc123b422",
        "query_id=AAHBBegiAwAAAMEF6CIPuJAP&user=%7B%22id%22%3A7028082113%2C%22first_name%22%3A%22Q%22%2C%22last_name%22%3A%22%22%2C%22language_code%22%3A%22en%22%2C%22allows_write_to_pm%22%3Atrue%7D&auth_date=1725870562&hash=0c0aab2f71348e93a6e41de5e6a19c012fc21e824a08e9ed3ee9925070a3e5e5",
        "query_id=AAESPPoYAwAAABI8-hgR9kxK&user=%7B%22id%22%3A6861503506%2C%22first_name%22%3A%22W%22%2C%22last_name%22%3A%22%22%2C%22language_code%22%3A%22bg%22%2C%22allows_write_to_pm%22%3Atrue%7D&auth_date=1725870657&hash=8776f01e0a5923e818f495eb1868f506dc9b2ab232c3e4b2a904b7f9d4d2e309" */
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
