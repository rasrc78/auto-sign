import { Session } from '../utils/session.mjs'

function checkSession(session) {
    return (session instanceof Session) ? true : false;
}

async function getFormHash(session, url, init = {}) {
    try {
        const text = await (await session.fetch(url, { init })).text();
        const regex = /<input\b[^>]*\bname\s*=\s*["']formhash["'][^>]*\bvalue\s*=\s*["'](\w+)["'][^>]*>/i;
        const formhash = text.match(regex)?.[1];

        if (!formhash) throw new Error('Failed to match the formhash.');

        return formhash;
    } catch(err) {
        throw new Error('Failed to get the formhash.', { cause: err })
    }
}

export async function dsuSign(session, baseUrl, {init = {}, options = {}} = {}) {
    if (!checkSession(session)) throw new Error('The session parameter is not an instance of Session.');
    const formhash = await getFormHash(session, baseUrl, init);
    const url = new URL('/plugin.php?id=dsu_paulsign:sign&operation=qiandao&infloat=1&inajax=1', baseUrl);
    const headers = {
        referer: (new URL('/plugin.php?id=dsu_paulsign:sign', baseUrl)).href,
        ...init?.headers
    }
    const body = {
        formhash: formhash,
        qdxq: options.mood || 'kx',
        qdmode: options.mode || 1,
        todaysay: options.message || '',
        fastreply: options.fastReply || 0
    }

    const resp = await session.fetch(url, {
        ...init, 
        method: 'POST', 
        headers: headers, 
        body: JSON.stringify(body)
    })
    if (!resp.ok) throw new Error(`Status Code: ${resp.status}, Host: ${url.hostn}`);

    const msgRegex = /<div\s+class=['"]c['"]>\s*([^]*?)\s*<\/div>/i;
    const message = ((await resp.text()).match(msgRegex))?.[1]?.trim();

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
    if (!resp.ok) throw new Error(`Status Code: ${resp.status}, Host: ${url.host}`);

    const msgRegex = /<div\s+id=['"]messagetext['"][^]*?<p>\s*([^<]+)/i;
    const message = ((await resp.text()).match(msgRegex))?.[1]?.trim();

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
    if (!resp.ok) throw new Error(`Status Code: ${resp.status}, Host: ${url.host}`);
    
    if (!(await resp.text()).includes('action=login')) return true;
    return false;
}