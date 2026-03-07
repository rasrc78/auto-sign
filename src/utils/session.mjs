import { URL } from 'node:url';
// import { fetch } from 'undici';
import { Cookie, CookieJar, getPublicSuffix } from 'tough-cookie';

export function createSession() {
    const cookieJar = new CookieJar();

    async function getCookies(url) {
        return (await cookieJar.getCookies(url)).map(cookie => cookie.cookieString()).join(';');
    }

    async function setCookies(cookies, url) {
        let hostname = (new URL(url)).hostname
        cookies.split(';').forEach(cookie => {
            cookieJar.setCookie(Cookie.parse(`${cookie}; Domain=${getPublicSuffix(hostname)}; Path=/;`), url)
        })
    }

    async function sessionFetch(url, init = {}) {
        const cookies = await getCookies(url);
        const headers = {...(init?.headers || {}), cookie: cookies};
        url = new URL(url);

        const response = await fetch(url, {...init, headers: headers, redirect: 'manual'});  // `init`相当于`fetch()`的同名参数。

        const setCookieHeader = response.headers.get('set-cookie');
        if (setCookieHeader) setCookieHeader.split(',').forEach(cookie => {
            cookieJar.setCookie(Cookie.parse(cookie), url)
        })

        if (/^(3\d\d|201)$/.test(response.status)) {
            const location = response.headers.get('location');
            if (location) {
                const newUrl = new URL(location, url.origin)
                return await sessionFetch(newUrl, {...init});
            }
        }
        return response;
    }

    return {
        'fetch': sessionFetch,
        'getCookies': getCookies,
        'setCookies': setCookies
    }
}