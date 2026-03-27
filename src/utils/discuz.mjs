import { Session } from '../utils/session.mjs'

function checkSession(session) {
    return (session instanceof Session) ? true : false;
}

async function getFormHash(session, url, init = {}) {
    const text = await (await session.fetch(url, { init })).text();
    const regex = /<input\b[^>]*\bname\s*=\s*["']formhash["'][^>]*\bvalue\s*=\s*["'](\w+)["'][^>]*>/i;
    const formhash = text.match(regex)?.[1];

    if (!formhash) throw new Error(`Fetch formhash failed. url=${url?.href || url}`);

    return formhash;
}

function toUrlEncoded(object) {
    let items = [];
    Object.keys(object).forEach((key) => {
        items.push(`${key}=${object[key]}`)
    })

    return items.join('&')
}

export async function dsuSign(session, baseUrl, options = {}) {
    let init = options.init || {};
    const signOptions = options.signOptions || {};

    if (!checkSession(session)) throw new Error('The session parameter is not an instance of Session.');
    const formhash = await getFormHash(session, baseUrl, init);
    const url = new URL('/plugin.php?id=dsu_paulsign:sign&operation=qiandao&infloat=1&inajax=1', baseUrl);
    const headers = {
        referer: (new URL('/plugin.php?id=dsu_paulsign:sign', baseUrl)).href,
        ...init?.headers
    }
    const body = {
        formhash: formhash,
        qdxq: signOptions.mood || 'kx',
        qdmode: signOptions.mode || 3,
        todaysay: signOptions.message || '',
        fastreply: signOptions.fastReply || 0
    }
    init = {
        ...init, 
        method: 'POST', 
        headers: headers, 
        body: toUrlEncoded(body)
    }

    const resp = await session.fetch('https://bbs.acgrip.com/plugin.php?id=dsu_paulsign:sign&operation=qiandao&infloat=1&inajax=1', { init })
    if (!resp.ok) throw new Error(`HTTP error. status_code=${resp.status}, host=${url.host}`);

    const msgRegex = /<div\s+class=['"]c['"]>\s*([^]*?)\s*<\/div>/i;
    const message = ((await resp.text()).match(msgRegex))?.[1]?.trim() || '';

    const errno = message.includes('成功') ? 0 : 1;

    return { errno: errno, message: message };
}

export async function zqljSign(session, baseUrl, { init = {} } = {}) {
    if (!checkSession(session)) throw new Error('The session parameter is not an instance of Session.');

    const formhash = await getFormHash(session, baseUrl, init);
    const url = new URL('/plugin.php?id=zqlj_sign', baseUrl);
    url.searchParams.append('sign', formhash)

    const headers = {
        referer: url.href,
        ...(init?.headers || {})
    }
    init = { ...init, method: 'GET', headers: headers }

    const resp = await session.fetch(url, { init })
    if (!resp.ok) throw new Error(`HTTP error. status_code=${resp.status}, host=${url.host}`);


    const msgRegex = /<div\s+id=['"]messagetext['"][^]*?<p>\s*([^<]+)/i;
    const message = ((await resp.text()).match(msgRegex))?.[1]?.trim() || '';

    const errno = message?.includes('成功') ? 0 : 1;

    return { errno: errno, message: message };
}


export async function checkLogin(session, baseUrl, {init = {}} = {}) {
    if (!checkSession(session)) throw new Error('The session parameter is not an instance of Session.');

    const url = new URL('/home.php?mod=spacecp', baseUrl);  // 用户设置页面
    const headers = {
        referer: url.origin + '/',
        ...(init?.headers || {})
    }
    init = { ...init, method: 'GET', headers: headers }

    const resp = await session.fetch(url, { init })
    if (!resp.ok) throw new Error(`HTTP error. status_code=${resp.status}, host=${url.host}`);
    
    if (!(await resp.text()).includes('action=login')) return true;
    return false;
}