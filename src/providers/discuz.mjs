import { request } from './utils.mjs'

async function getFormHash(session, url, init = {}) {
    const text = await (await request(session, url, init)).text()
    const regex = /<input\b[^>]*\bname\s*=\s*["']formhash["'][^>]*\bvalue\s*=\s*["'](\w+)["'][^>]*>/i
    const formhash = text.match(regex)?.[1]

    if (!formhash) throw new Error(`Formhash fetching failed. URL=${url?.href || url}`)

    return formhash
}

function toUrlEncoded(object) {
    let items = []
    Object.keys(object).forEach((key) => {
        items.push(`${key}=${object[key]}`)
    })

    return items.join('&')
}

export async function dsuSignApi(session, baseUrl, options = {}) {
    const requestInit = options.requestInit || {}
    const signOptions = options.signOptions || {}

    const formhash = await getFormHash(session, baseUrl, requestInit)
    // const url = new URL('https://httpbin.org/anything')
    const url = new URL('/plugin.php?id=dsu_paulsign:sign&operation=qiandao&infloat=1&inajax=1', baseUrl)
    requestInit.headers = {
        referer: new URL('/plugin.php?id=dsu_paulsign:sign', baseUrl).href,
        ...requestInit?.headers,
    }
    requestInit.body = toUrlEncoded({
        formhash: formhash,
        qdxq: signOptions.mood || 'kx',
        qdmode: signOptions.mode || 3,
        todaysay: signOptions.message || '',
        fastreply: signOptions.fastReply || 0,
    })
    requestInit.method = 'POST'

    const resp = await request(session, url, requestInit)
    const result = await resp.text()

    const msgRegex = /<div class="c(\s+[\w-]+)?">\s*(<div class="alert_error">)?([^<]+)/i
    const message = result.match(msgRegex)?.[3]?.trim() || ''
    const success = message?.includes('成功') ? true : false

    return { success , message }
}

export async function zqljSignApi(session, baseUrl, requestInit = {}) {
    const formhash = await getFormHash(session, baseUrl, requestInit)
    const url = new URL('/plugin.php?id=zqlj_sign', baseUrl)
    url.searchParams.append('sign', formhash)

    requestInit.headers = {
        referer: url.href,
        ...(requestInit?.headers || {}),
    }
    requestInit.method = 'GET'

    const resp = await request(session, url, requestInit)
    const result = await resp.text()

    const msgRegex = /<div id="messagetext"[\S\s]*?<p>\s*([^<]+)/i
    const message = result.match(msgRegex)?.[1]?.trim() || ''
    const success = message?.includes('成功') ? true : false

    return { success, message }
}

export async function checkLogin(session, baseUrl, requestInit = {}) {
    const url = new URL('/home.php?mod=spacecp', baseUrl) // 用户自定义资料页面
    const headers = {
        referer: url.origin + '/',
        ...(requestInit?.headers || {}),
    }
    requestInit = { ...requestInit, method: 'GET', headers: headers }

    const resp = await request(session, url, requestInit)
    const result = await resp.text()

    if (!result.includes('action=login')) {
        return true
    } else {
        return false
    }
}
