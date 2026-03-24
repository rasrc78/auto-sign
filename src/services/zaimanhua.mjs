import { createHash } from 'node:crypto';
import { Session } from '../utils/session.mjs'
import { Logger } from '../utils/logger.mjs';

const COOKIE_ID = 'zaimanhua';

const logger = new Logger('ZaiManHua');
const session = new Session(COOKIE_ID);
const indexUrl = new URL('https://www.zaimanhua.com');
let config = null;

async function getCaptchaId(init = {}) {
    try {
        const text = await (await session.fetch(indexUrl, { init: init })).text();
        const regex = /captchaId:\s*(['"])(\w{8}(-\w{4}){3}-\w{12})\1/i;  // 没有必要严格匹配UUID。
        return ((text.match(regex)) || [])[2] || '';
    } catch(err) {
        logger.warn('获取 CAPTCHA ID 失败')
        logger.error(err)
        return '';
    }

}

function exportToken() {
    const cookieJar = session.getCookieJar();
    const token = cookieJar.getObject(COOKIE_ID)?.token;
    if (!token) throw new Error('Token not found.');

    return token;
}

function passwdToHash(passwd) {
    const generateMD5 = (text) => createHash('md5').update(text).digest('hex');
    const md5Regex = /^[0-9a-f]{32}$/;

    return md5Regex.test(passwd) ? passwd : generateMD5(passwd);
}

async function login(username, password, init = {}) {
    try {
        const url = new URL('https://manhua.zaimanhua.com/lpi/v1/login/passwd');
        const captchaId = await getCaptchaId({ ...init });
        const loginData = {
            username: username,
            passwd: password,
            captchaId: captchaId,
            captchaResult: '%5B%5D',
            captchaCate: 2
        }
        const headers = {
            ...init?.headers,
            referer: indexUrl.href
        }
        init = {
            ...init, 
            method: 'POST', 
            headers: headers, 
            body: JSON.stringify(loginData)
        }

        const resp = await session.fetch(url, { init });
        if (!resp.ok) {
            throw new Error(`HTTP error | status_code=${resp.status}`);
        }

        const resJSON = await resp.json();
        if (resJSON.errno !== 0) {
            throw new Error(`Request rejected | errno=${resJSON.errno}, errmsg: ${resJSON.errmsg}`);
        }

        const userInfo = resJSON.data.user;
        session.setCookies(`token=${userInfo.token}`, COOKIE_ID)

        return userInfo;
    } catch (err) {
        logger.error(`登录时发生错误 | username=${username}`)
        throw err;
    }
}

async function signin(init = {}) {
    try {
        const url = new URL('https://i.zaimanhua.com/lpi/v1/task/sign_in');
        const token = exportToken();
        const headers = {
            ...init?.headers,
            authorization: `Bearer ${token}`,
            referer: url.origin + '/'
        };

        const resp = await session.fetch(url, { init: { ...init, headers: headers, method: 'POST' } });
        if (!resp.ok) {
            throw new Error(`HTTP error | status_code=${resp.status}`);
        }

        const resJSON = await resp.json();
        if (resJSON.errno !== 0) {
            throw new Error(`Request rejected | errno=${resJSON.errno}, errmsg=${resJSON.errmsg}`);
        }
    } catch(err) {
        logger.error(`签到时发生错误`)
        throw err;
    }
}

async function getUserInfo(init = {}) {
    try {
        const url = new URL('https://account-api.zaimanhua.com/v1/userInfo/get');
        const token = exportToken();
        const headers = {
            ...init?.headers,
            authorization: `Bearer ${token}`,
            referer: indexUrl.href
        };

        const resp = await session.fetch(url, { init: { ...init, headers: headers, method: 'GET' } });
        if (!resp.ok) {
            throw new Error(`HTTP error | status_code=${resp.status}`);
        }
        
        const resJSON = await resp.json();
        if (resJSON.errno !== 0) {
            throw new Error(`Request rejected | errno=${resJSON.errno}, errmsg=${resJSON.errmsg}`);
        }

        return resJSON.data.userInfo;
    } catch(err) {
        logger.error(`获取用户信息时发生错误`)
        throw err;
    }
}

/**
 * 
 * @param {object} taskConfig
 * @returns {string} taskConfig
 */
export async function runTask(taskConfig) {
    try {
        config = taskConfig
        config.password = passwdToHash(config.password)
        const baseHeaders = {
            'accept-language': 'zh-CN,zh;q=0.9,en;q=0.8',
            'user-agent': config.userAgent
        }

        if (config.cookie) {
            session.setCookies(config.cookie, COOKIE_ID)
        } else {
            await login(config.username, config.password, { headers: baseHeaders });
        }
        const userInfo = await getUserInfo({ headers: baseHeaders });
        session.setCookies(`token=${userInfo.token}`, COOKIE_ID)

        await signin({ headers: baseHeaders })
    } catch(err) {
        logger.error(err)
        throw new Error(`签到任务执行失败 | service_name=zaimanhua`);
    } finally {
        config.cookie = session.getCookies(COOKIE_ID)
        return config;
    }
}
