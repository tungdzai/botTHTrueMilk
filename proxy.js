require('dotenv').config();
const axios = require('axios');
const {HttpsProxyAgent} = require('https-proxy-agent');
const key = process.env.KEY_PROXY;

let cachedProxies = null;
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
        console.error('Lỗi khi lấy proxy:', error.message);
        return null;
    }
}
async function getProxiesData() {
    if (!cachedProxies) {
        console.log('Dữ liệu proxy chưa có cập nhật lại')
        await getProxy();
    }
    return cachedProxies;
}

async function parseProxy(proxy) {
    const [host, port, user, password] = proxy.split(':');
    return {host, port, user, password};
}

async function getRandomProxy() {
    const proxiesData = await getProxiesData();

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

    const { host: proxyHost, port: proxyPort, user: proxyUser, password: proxyPassword } = proxyData;
    const proxyUrl = `http://${proxyUser}:${proxyPassword}@${proxyHost}:${proxyPort}`;
    return new HttpsProxyAgent(proxyUrl);
}


async function checkProxy() {
    try {
        await axios.get('https://api.ipify.org?format=json', {
            httpAgent: await randomProxy(),
            httpsAgent: await randomProxy()
        });
        return true;
    } catch (error) {
        console.error('Lỗi khi kiểm tra proxy:', error.message);
        console.log('Đang làm mới danh sách proxy...');
        await getProxy();
        try {
            await axios.get('https://api.ipify.org?format=json', {
                httpAgent: await randomProxy(),
                httpsAgent: await randomProxy()
            });
            return true;
        } catch (retryError) {
            console.error('Lỗi khi kiểm tra lại proxy:', retryError.message);
            return false;
        }
        return false;
    }
}

module.exports = {randomProxy, checkProxy};
