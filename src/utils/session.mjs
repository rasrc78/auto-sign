import { URL } from 'node:url';

class Cookie {
    constructor() {
        this._cookieMaps = new Map();
        this._cookieMaps.set('default', new Map())
    }

    setCookie(cookie, identifier = 'default') {
        if (!this._cookieMaps.has(identifier)) {
            this._cookieMaps.set(identifier, new Map());
        }
        const cookieMap = this._cookieMaps.get(identifier);
        const parsedCookie = cookie.match(/^([^=]+)=([^;]*)/);

        if (!parsedCookie) throw new Error('Cookie cannot be parsed.')
        cookieMap.set(parsedCookie[1], parsedCookie[2])
    }

    getCookieValue(cookieName, identifier = 'default') {
        const cookieMap = this._getCookieMap(identifier);
        return cookieMap.get(cookieName);
    }

    getHeaderString(identifier = 'default') {
        const cookieMap = this._getCookieMap(identifier);
        let cookies = [];
        for (const [cookieName, cookieValue] of cookieMap) {
            cookies.push(`${cookieName}=${cookieValue}`)
        }
        return cookies.join(';');
    }

    getCookies(identifier = 'default') {
        const cookieMap = this._getCookieMap(identifier);
        return Object.fromEntries(cookieMap.entries());
    }

    _getCookieMap(identifier) {
        const cookieMap = this._cookieMaps.get(identifier) || new Map();
        // if (!cookieMap) throw new Error('Cookie not found.');
        return cookieMap;
    }
}

export class Session {
    constructor(cookieID = 'default', cookieJar = new Cookie()) {
        this.cookieJar = cookieJar
        this.cookieID = cookieID
    }

    /**
     * @param {string} cookies - Header String
     * @param {*} cookieID - Cookie Identifier
     */
    setCookies(cookies, cookieID = this.cookieID) {
        cookies.split(';').forEach(cookie => {this.cookieJar.setCookie(cookie, cookieID)})
    }

    /**
     * @param {string} cookieID - Cookie Identifier
     * @returns {string} Cookie Header String
     */
    getCookies(cookieID = this.cookieID) {
        return this.cookieJar.getHeaderString(cookieID)
    }

    async fetch(url, {init = {}, cookieID = this.cookieID} = {}) {
        const cookies = this.cookieJar.getHeaderString(cookieID);
        const headers = {...(init?.headers || {}), cookie: cookies};
        url = new URL(url);

        const response = await fetch(url, {...init, headers: headers, redirect: 'manual'});  // `init`相当于`fetch()`的同名参数。

        const setCookieHeader = response.headers.getSetCookie();
        if (setCookieHeader) setCookieHeader.forEach(cookie => {
            this.cookieJar.setCookie(cookie, cookieID)
        })
        // const setCookieHeader = response.headers.get('set-cookie');
        // if (setCookieHeader) setCookieHeader.split(',').forEach(cookie => {
        //     this.cookieJar.setCookie(cookie, cookieID)
        // })

        // 处理重定向
        if (/^(3\d\d|201)$/.test(response.status)) {
            const location = response.headers.get('location');
            if (location) {
                const newUrl = new URL(location, url.origin)
                return await this.fetch(newUrl, {...init});
            }
        }
        return response;
    }
}
