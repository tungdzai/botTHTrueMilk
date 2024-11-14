const axios = require('axios');
const {randomProxy, checkProxy} = require('./proxy');
const {generateCardCode, generateRandomPhone, getRandomTime} = require('./handlers');
const {sendTelegramMessage} = require('./telegram');
const keep_alive = require('./keep_alive.js');

async function handleYogurtTop(item, retries = 3) {
    if (retries < 0) {
        return null
    }
    if (retries < 3) {
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
    if (retries < 3) {
        await getRandomTime(1000, 3000)
    }

    try {
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
            }

        ];
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
            }
        }
    } catch (error) {
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
            await new Promise(resolve => setTimeout(resolve, 300));
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
    await new Promise(resolve => setTimeout(resolve, 10000));
}

async function checkProxyAndRun() {
    while (true) {
        const isProxyWorking = await checkProxy();
        if (isProxyWorking) {
            await runIndependentRequests(600, 15);
        } else {
            console.error("Proxy không hoạt động. Dừng lại.");
            break
        }
    }

}

checkProxyAndRun();