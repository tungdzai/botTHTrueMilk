const axios = require('axios');
const {randomProxy, checkProxy} = require('./proxy');
const {generateCardCode, generateRandomPhone, getRandomTime, generateRandomUserName} = require('./handlers');
const {sendTelegramMessage} = require('./telegram');
const keep_alive = require('./keep_alive.js');

async function login(retries = 3) {
    if (retries < 0) {
        return null
    }
    if (retries < 3) {
        await getRandomTime(1000, 5000)
    }
    try {
        const randomName = await generateRandomUserName();
        const nameParts = randomName.split(' ');
        const lastName = nameParts[0];
        const middleName = nameParts.slice(1, -1).join(' ');
        const firstName = nameParts[nameParts.length - 1];
        const phone = await generateRandomPhone();
        const data = `name=${lastName}+${middleName}+${firstName}&phone=${phone}`;
        const proxy = await randomProxy();
        const response = await axios.post('https://thmistoriapi.zalozns.net/backend-user/login/th', data, {
            headers: {
                'Host': 'thmistoriapi.zalozns.net',
                'sec-ch-ua-platform': 'Android',
                'user-agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36',
                'accept': 'application/json, text/javascript, */*; q=0.01',
                'sec-ch-ua': '"Chromium";v="130", "Google Chrome";v="130", "Not?A_Brand";v="99"',
                'content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
                'x-pgp-api-media': '1',
                'sec-ch-ua-mobile': '?1',
                'origin': 'https://quatangmistori.thmilk.vn',
                'sec-fetch-site': 'same-origin',
                'sec-fetch-mode': 'cors',
                'sec-fetch-dest': 'empty',
                'referer': 'https://quatangmistori.thmilk.vn/',
                'accept-encoding': 'gzip, deflate, br, zstd',
                'accept-language': 'vi-VN,vi;q=0.9,fr-FR;q=0.8,fr;q=0.7,en-US;q=0.6,en;q=0.5',
                'priority': 'u=1'
            },
            httpAgent: proxy,
            httpsAgent: proxy,
        });
        return response.data

    } catch (error) {
        if (error.response) {
            const message = `Lỗi login ${error.status}. Login thực hiện chạy lại....`;
            console.log(message);
            return await login(retries - 1);
        }
        console.error('login lỗi:', error.response ? error.response.status : error.message);
    }
}
async function checkCodeLucky(token, gift, retries = 5) {
    if (retries < 0) {
        return null;
    }
    if (retries < 5) {
        await getRandomTime(3000, 10000)
    }
    try {
        const proxy = await randomProxy();
        const response = await axios.get(`https://thmistoriapi.zalozns.net/campaigns/check-code-lucky/${gift}`, {
            headers: {
                'Host': 'thmistoriapi.zalozns.net',
                'sec-ch-ua-platform': 'Android',
                'authorization': token,
                'sec-ch-ua': '"Chromium";v="130", "Google Chrome";v="130", "Not?A_Brand";v="99"',
                'x-pgp-api-media': '1',
                'sec-ch-ua-mobile': '?1',
                'user-agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36',
                'accept': 'application/json, text/javascript, */*; q=0.01',
                'x-pgp-api-campaign': 'bac_giang',
                'origin': 'https://quatangmistori.thmilk.vn',
                'sec-fetch-site': 'same-origin',
                'sec-fetch-mode': 'cors',
                'sec-fetch-dest': 'empty',
                'referer': 'https://quatangmistori.thmilk.vn/',
                'accept-encoding': 'gzip, deflate, br, zstd',
                'accept-language': 'vi-VN,vi;q=0.9,fr-FR;q=0.8,fr;q=0.7,en-US;q=0.6,en;q=0.5',
                'priority': 'u=1'
            },
            httpAgent: proxy,
            httpsAgent: proxy,
        });
        return response.data

    } catch (error) {
        if (error.response && (error.status === 504)) {
            const message = `Lỗi checkCodeLucky ${error.status}. Mã mistori thực hiện chạy lại....`;
            console.log(message);
            return await checkCodeLucky(token, gift, retries - 1);
        }
        console.error('checkCodeLucky lỗi:', error.response ? error.response.status : error.message);
    }
}

async function handleMistori(gift) {
    const resultLogin = await login();
    if (resultLogin && resultLogin.result_code === 100) {
        const token = resultLogin.token;
        return await checkCodeLucky(token, gift)
    }else {
        console.error("Lỗi: resultLogin không hợp lệ hoặc thiếu 'result_code'", resultLogin);
        return null;
    }
}

async function handleYogurtTop(item, retries = 5) {
    if (retries < 0) {
        return null
    }
    if (retries < 5) {
        await getRandomTime(1000, 5000)
    }
    try {
        const phone = await generateRandomPhone();
        const postData = `Code=${item.gift}&Phone=${phone}`;
        const proxy = await randomProxy();
        const response = await axios.post(item.url, postData, {
            headers: {
                'Host': item.host,
                'sec-ch-ua': '"Chromium";v="124", "Google Chrome";v="124", "Not-A.Brand";v="99"',
                'accept': '*/*',
                'content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
                'x-requested-with': 'XMLHttpRequest',
                'sec-ch-ua-mobile': '?1',
                'user-agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36',
                'sec-ch-ua-platform': '"Android"',
                'origin': item.origin,
                'sec-fetch-site': 'same-origin',
                'sec-fetch-mode': 'cors',
                'sec-fetch-dest': 'empty',
                'referer': item.referer,
                'accept-encoding': 'gzip, deflate, br, zstd',
                'accept-language': 'vi-VN,vi;q=0.9,fr-FR;q=0.8,fr;q=0.7,en-US;q=0.6,en;q=0.5',
                'priority': 'u=1'
            },
            httpAgent: proxy,
            httpsAgent: proxy,
        });
        return response.data
    } catch (error) {
        if (error.response && (error.status === 429)) {
            const message = `Lỗi handleYogurtTop ${error.status} thực hiện chạy lại....`;
            console.log(message);
            return await handleYogurtTop(item, retries - 1);
        }
        console.error('handleYogurtTop lỗi:', error.response ? error.response.status : error.message);
    }

}

async function sendDataToAPI(code, batchNumber, retries = 3) {
    if (retries < 0) {
        return null;
    }

    const dataList = [
        {
            url: 'https://quatangyogurt.thmilk.vn/Home/CheckCode',
            gift: `YE4${code}`,
            host: 'quatangyogurt.thmilk.vn',
            origin: 'https://quatangyogurt.thmilk.vn',
            referer: 'https://quatangyogurt.thmilk.vn/'
        },
        {
            url: 'https://quatangtopkid.thmilk.vn/Home/CheckCode',
            gift: `TY4${code}`,
            host: 'quatangtopkid.thmilk.vn',
            origin: 'https://quatangtopkid.thmilk.vn',
            referer: 'https://quatangtopkid.thmilk.vn/'
        },
        {
            gift: `MY4${code}`,
        }

    ];
    if (retries < 3) {
        await getRandomTime(1000, 5000);
    }

    try {
        for (const item of dataList) {
            if (item.gift.startsWith("YE") || item.gift.startsWith("TY")) {
                const responseYogurtTop = await handleYogurtTop(item);
                if (responseYogurtTop !== null) {
                    const status = responseYogurtTop.Type;
                    const message = responseYogurtTop.Message;
                    if (status !== 'error') {
                        const messageText = `${item.gift}`;
                        await sendTelegramMessage(messageText);
                    }
                    console.log(`[Batch ${batchNumber}] ${item.gift} ${message}`);
                }
            } else if (item.gift.startsWith("MY")) {
                const responseMistori = await handleMistori(item.gift);
                if (responseMistori.result_code === 100) {
                    const messageText = `${item.gift}`;
                    await sendTelegramMessage(messageText);
                }
                console.log(`[Batch ${batchNumber}] ${item.gift} ${responseMistori.result_code}`);
            }
        }
    } catch (error) {
        // console.log(`Lỗi sendDataToAPI`,error)
        if (error.response && (error.status === 429) ) {
            const message = `Lỗi sendDataToAPI ${error.status} thực hiện chạy lại....`;
            console.log(message);
            return await sendDataToAPI(code, retries - 1);
        }
        console.error('sendDataToAPI lỗi:', error);
    }
}

async function runIndependentRequests(requests, batchSize) {
    const runBatch = async (batchNumber) => {
        const promises = [];

        for (let j = 0; j < batchSize; j++) {
            const code = await generateCardCode();
            await new Promise(resolve => setTimeout(resolve, 250));
            promises.push(sendDataToAPI(code, batchNumber));
        }

        await Promise.allSettled(promises);

        console.log(`Batch ${batchNumber} đã hoàn thành`);
    };

    const batches = Math.ceil(requests / batchSize);
    const batchPromises = [];

    for (let i = 0; i < batches; i++) {
        batchPromises.push(runBatch(i + 1));
    }

    await Promise.all(batchPromises);
    console.log('Tất cả các batch đã hoàn thành. Nghỉ 10 giây...');
    await new Promise(resolve => setTimeout(resolve, 15000));
}

async function checkProxyAndRun() {
    while (true) {
        const isProxyWorking = await checkProxy();
        if (isProxyWorking) {
            await runIndependentRequests(150, 15);
        } else {
            console.error("Proxy không hoạt động. Dừng lại.");
            break
        }
    }

}

checkProxyAndRun();
