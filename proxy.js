require('dotenv').config();
const axios = require('axios');
const {HttpsProxyAgent} = require('https-proxy-agent');
const key = process.env.KEY_PROXY;

async function getProxy() {
    const loaiproxy = 'Viettel';
    const url = `https://proxy.vn/api/listproxy.php?key=${key}&loaiproxy=${loaiproxy}`;

    try {
        const response = await axios.get(url);

        return response.data
            .split('}{')
            .map((str, index, arr) => {
                if (index === 0) return JSON.parse(`${str}}`);
                if (index === arr.length - 1) return JSON.parse(`{${str}`);
                return JSON.parse(`{${str}}`);
            });
    } catch (error) {
        console.error('Lỗi khi lấy proxy:', error.message);
        return null;
    }
}

async function parseProxy(proxy) {
    const [host, port, user, password] = proxy.split(':');
    return {host, port, user, password};
}

async function getRandomProxy() {
    const proxiesData = await getProxy();

    if (!proxiesData || proxiesData.length === 0) {
        console.error('Không có proxy nào để sử dụng');
        return null;
    }

    const randomProxyData = proxiesData[Math.floor(Math.random() * proxiesData.length)];
    const proxy = randomProxyData.proxy;
    return parseProxy(proxy);
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
        const response = await axios.get('https://api.ipify.org?format=json', {
            httpAgent: await randomProxy(),
            httpsAgent: await randomProxy()
        });
        console.log('Địa chỉ IP đã dùng:', response.data.ip);
        return true;
    } catch (error) {
        console.error('Lỗi khi kiểm tra proxy:', error.message);
        return false;
    }
}

module.exports = {randomProxy, checkProxy};
