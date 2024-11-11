require('dotenv').config();
const axios = require('axios');
const {HttpsProxyAgent} = require('https-proxy-agent');
const fs = require('fs');  // Thêm module fs để đọc file
const key = process.env.KEY_PROXY;

let cachedProxies = null;

// Lấy proxy từ api
async function getProxy() {
    const loaiproxy = 'Viettel';
    const url = `https://proxy.vn/api/listproxy.php?key=${key}&loaiproxy=${loaiproxy}`;

    try {
        const response = await axios.get(url);

        cachedProxies = response.data
            .split('}{')
            .map((str, index, arr) => {
                if (index === 0) return JSON.parse(`${str}}`);
                if (index === arr.length - 1) return JSON.parse(`{${str}`);
                return JSON.parse(`{${str}}`);
            });

        return cachedProxies;
    } catch (error) {
        return null;
    }
}

// Lấy proxy từ file
async function getProxiesFromFile() {
    try {
        const data = fs.readFileSync('proxy.txt', 'utf8');
        return data.split('\n').map(line => {
            const [host, port, user, password] = line.split(':');
            return {host, port, user, password};
        });
    } catch (error) {
        console.error('Lỗi lấy proxy từ file:', error.message);
        return [];
    }
}

async function getProxiesData() {
    if (!cachedProxies) {
        console.log('Dữ liệu proxy chưa có, đang cập nhật lại...');
        await getProxy();

        if (!cachedProxies || cachedProxies.length === 0) {
            cachedProxies = await getProxiesFromFile();
        }
    }
    return cachedProxies;
}

async function getRandomProxy() {
    const proxiesData = await getProxiesData();

    if (!proxiesData || proxiesData.length === 0) {
        console.error('Không có proxy nào để sử dụng');
        return null;
    }

    return proxiesData[Math.floor(Math.random() * proxiesData.length)];
}

async function randomProxy() {
    const proxyData = await getRandomProxy();
    if (!proxyData) {
        console.error('Không thể tạo proxy');
        return null;
    }

    const {host: proxyHost, port: proxyPort, user: proxyUser, password: proxyPassword} = proxyData;
    const proxyUrl = `http://${proxyUser}:${proxyPassword}@${proxyHost}:${proxyPort}`;
    return new HttpsProxyAgent(proxyUrl);
}

async function checkProxy() {
    try {
        const proxy = await randomProxy();
        if (proxy) {
            await axios.get('https://api.ipify.org?format=json', {
                httpAgent: proxy,
                httpsAgent: proxy
            });

            return true;
        } else {
            return false;
        }
    } catch (error) {
        await getProxy();
        if (!cachedProxies || cachedProxies.length === 0) {
            console.log('Thử lại proxy từ file...');
            cachedProxies = await getProxiesFromFile();
        }

        try {
            const proxy = await randomProxy();
            if (proxy) {
                await axios.get('https://api.ipify.org?format=json', {
                    httpAgent: proxy,
                    httpsAgent: proxy
                });

                return true;
            }
        } catch (retryError) {
            return false;
        }
    }
}

module.exports = {randomProxy, checkProxy};
