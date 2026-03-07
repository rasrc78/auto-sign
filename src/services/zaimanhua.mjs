import { createSession } from '../utils/session.mjs'
import { logging } from '../utils/logging.mjs';

const session = createSession();
const indexUrl = new URL('https://www.zaimanhua.com');
let configs = { log: false };

async function getCaptchaId(init = {}) {
    try {
        const res = await session.fetch(indexUrl, {...init});
        const text = await res.text()
        const regex = /captchaId:\s*(['"])(\w{8}(-\w{4}){3}-\w{12})\1/i;  // 没有必要严格匹配UUID。
        return ((text.match(regex)) || [])[2] || '';
    } catch(err) {
        logging('[ZaiManHua] Failed to get chaptcha ID.', 'WARN', {fileOutput: configs.log})
        logging(err, 'ERROR', {fileOutput: configs.log})
        return '';
    }

}

async function exportToken(url) {
    const cookies = await session.getCookies(url);
    const token = cookies.match(/(?:^|;\s*)token=([^;]+)/)?.[1];
    if (!token) throw new Error('Failed to get token.');
    return token;
}

async function login(username, password, init = {}) {
    try {
        const url = new URL('https://manhua.zaimanhua.com/lpi/v1/login/passwd');
        const captchaId = await getCaptchaId({...init});
        const loginData = {
            username: username,
            passwd: password,
            captchaId: captchaId,
            captchaResult: '%5B%5D',
            captchaCate: 2
        }
        const res = await session.fetch(loginUrl, {...init, 
            method: 'POST', 
            headers: {...init.headers, referer: indexUrl.href, "content-type": "application/json"}, 
            body: JSON.stringify(loginData)
        });

        if (!res.ok) {
            throw new Error(`Rejected when logging in as ${username} | Status Code: ${res.status}`);
        }
        
        const userInfo = await res.json();

        if (userInfo.errno !== 0) {
            throw new Error(`Rejected when logging in as ${username}. | Error Code: ${userInfo.errno}, Error Message: ${userInfo.errmsg}`);
        }

        return userInfo.data.user;

        
    } catch (err) {
        logging(`[ZaiManHua] An error occurred during logging in as ${username}.`, 'ERROR', {fileOutput: configs.log})
        throw err;
    }
}

async function signin(init = {}) {
    try {
        const url = new URL('https://i.zaimanhua.com/lpi/v1/task/sign_in');
        const token = await exportToken(url);
        const headers = {
            ...init.headers,
            authorization: `Bearer ${token}`,
            referer: 'https://i.zaimanhua.com/'
        };

        const res = await session.fetch(url, {...init, headers: headers, method: 'POST'});
        if (!res.ok) {
            throw new Error(`Failed to sign in. | Status Code: ${res.status}`);
        }

        const msg = await res.json();
        if (msg.errno !== 0) {
            throw new Error(`Failed to sign in. | Error Code: ${msg.errno}, Error Message: ${msg.errmsg}`);
        }
    } catch(err) {
        logging(`[ZaiManHua] An error occurred during sign-in.`, 'ERROR', {fileOutput: configs.log})
        throw err;
    }
}

async function getUserInfo(init = {}) {
    try {
        const url = new URL('https://account-api.zaimanhua.com/v1/userInfo/get');
        const token = await exportToken(url);
        const headers = {
            ...init.headers,
            authorization: `Bearer ${token}`,
            referer: indexUrl.href
        };

        const res = await session.fetch(url, {...init, headers: headers, method: 'GET'});
        if (!res.ok) {
            throw new Error(`Failed to get user information. | Status Code: ${res.status}`);
        }
        
        const data = await res.json();
        if (data.errno !== 0) {
            throw new Error(`Failed to get user information. | Error Code: ${data.errno}, Error Message: ${data.errmsg}`);
        }

        return data.data.userInfo;
    } catch(err) {
        logging(`[ZaiManHua] An error occurred during getting user info.`, 'ERROR', {fileOutput: configs.log})
        throw err;
    }
}

/**
 * 
 * @param {object} taskConfigs
 * @returns {string} Cookies
 */
export async function runTask(taskConfigs) {
    try {
        configs = taskConfigs
        const baseHeaders = {
            'user-agent': configs['user-agent'],
            'accept': '*/*',
            'accept-language': 'zh-CN,zh;q=0.9,en;q=0.8'
        }

        let userInfo;
        if (configs.cookie) {
            session.setCookies(configs.cookie, indexUrl)
            userInfo = await getUserInfo({headers: baseHeaders})
            session.setCookies(`token=${userInfo.token}`, indexUrl)
        } else {
            userInfo = await login(configs.username, configs.password, {headers: baseHeaders}, {enableLog: configs.log})
            session.setCookies(`token=${userInfo.token}`, indexUrl)
        }


        await signin({headers: baseHeaders})
    } catch(err) {
        logging(err, 'ERROR', {fileOutput: configs.log})
        throw new Error('Failed to execute sign-in task for zaimanhua.');
    } finally {
        return session.getCookies(indexUrl);
    }
}
