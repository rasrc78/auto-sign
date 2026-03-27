import { createHash } from 'node:crypto';
import { Session } from '../utils/session.mjs'
import { Logger } from '../utils/logger.mjs';

const COOKIE_ID = 'zaimanhua';

const logger = new Logger('ZaiManHua');
const session = new Session(COOKIE_ID);
const indexUrl = new URL('https://www.zaimanhua.com');

async function getCaptchaId(init = {}) {
    try {
        const text = await (await session.fetch(indexUrl, { init: init })).text();
        const regex = /captchaId:\s*(['"])(\w{8}(-\w{4}){3}-\w{12})\1/i;  // 没有必要严格匹配UUID。
        return ((text.match(regex)) || [])[2] || '';
    } catch(err) {
        logger.warn(`Fetch CAPTCHA ID failed.`, err)
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
        const detail = { status_code: resp.status, url: resp.url };
        logger.error(`HTTP error.`, detail)
        return;
    }

    const resJSON = await resp.json();
    if (resJSON.errno !== 0) {
        const detail = { error: resJSON.errno, errmsg: resJSON.errmsg };
        logger.error(`Login failed.`, detail)
        return;
    }

    const userInfo = resJSON.data.user;
    session.setCookies(`token=${userInfo.token}`, COOKIE_ID)

    return userInfo;
}

async function sign(init = {}) {
    const url = new URL('https://i.zaimanhua.com/lpi/v1/task/sign_in');
    const token = exportToken();
    const headers = {
        ...init?.headers,
        authorization: `Bearer ${token}`,
        referer: url.origin + '/'
    };

    const resp = await session.fetch(url, { init: { ...init, headers: headers, method: 'POST' } });
    if (!resp.ok) {
        const detail = { status_code: resp.status, url: resp.url };
        logger.error(`HTTP error.`, detail)
        return;
    }

    const resJSON = await resp.json();
    const logDetail = JSON.stringify({ error: resJSON.errno, errmsg: resJSON.errmsg });
    if (resJSON.errno !== 0) {
        logger.error(`Sign-in failed.`, logDetail)
        return;
    }

    logger.info(`Sign-in successful.`, logDetail)
}

async function getUserInfo(init = {}) {
    const url = new URL('https://account-api.zaimanhua.com/v1/userInfo/get');
    const token = exportToken();
    const headers = {
        ...init?.headers,
        authorization: `Bearer ${token}`,
        referer: indexUrl.href
    };

    const resp = await session.fetch(url, { init: { ...init, headers: headers, method: 'GET' } });
    if (!resp.ok) {
        const detail = { status_code: resp.status, url: resp.url };
        logger.error(`HTTP error.`, detail)
        return;
    }
    
    const resJSON = await resp.json();
    if (resJSON.errno !== 0) {
        const detail = { error: resJSON.errno, errmsg: resJSON.errmsg };
        logger.error(`Fetch user info failed.`, detail)
        return;
    }

    return resJSON.data.userInfo;
}

/**
 * 
 * @param {object} taskConfig
 * @returns {string} taskConfig
 */
export async function runTask(taskConfig) {
    try {
        taskConfig.password = passwdToHash(taskConfig.password)
        const baseHeaders = {
            'accept-language': 'zh-CN,zh;q=0.9,en;q=0.8',
            'content-type': 'application/json',
            'user-agent': taskConfig.userAgent
        }

        if (taskConfig.cookie) {
            session.setCookies(taskConfig.cookie, COOKIE_ID)
        } else {
            await login(taskConfig.username, taskConfig.password, { headers: baseHeaders });
        }
        const userInfo = await getUserInfo({ headers: baseHeaders });
        session.setCookies(`token=${userInfo.token}`, COOKIE_ID)

        await sign({ headers: baseHeaders })
    } catch(err) {
        logger.error('Unexpected error.', err)
    }

    taskConfig.cookie = session.getCookies(COOKIE_ID)
    return taskConfig;
}
