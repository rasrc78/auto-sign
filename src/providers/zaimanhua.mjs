import { Session } from '../utils/session.mjs'

const INDEX_URL = new URL('https://www.zaimanhua.com')

async function request(session, url, requestInit) {
    if (!(session instanceof Session)) {
        throw new Error('session is not instance of Session')
    }

    const resp = await session.fetch(url, requestInit)
    if (!resp.ok) {
        throw new Error(`HTTP Error. Status=${resp.status},URL=${resp.url.replace(/\?.+/, '')}`)
    }

    return resp
}

async function getCaptchaId(session, requestInit = {}) {
    try {
        const resp = await request(session, INDEX_URL, requestInit)
        const text = await resp.text()
        const regex = /captchaId:\s*(['"])(\w{8}(-\w{4}){3}-\w{12})\1/i
        return (text.match(regex) || [])[2] || ''
    } catch (err) {
        return ''  // 没有 CAPTCHA ID 也能正常发送请求，暂时也不知道有什么用
    }
}

export async function loginApi(session, username, password, requestInit = {}) {
    try {
        // const url = new URL('https://httpbin.org/anything')
        const url = new URL('https://manhua.zaimanhua.com/lpi/v1/login/passwd')
        const captchaId = await getCaptchaId(session, requestInit)
        const loginData = {
            username: username,
            passwd: password,
            captchaId: captchaId,
            captchaResult: '%5B%5D',
            captchaCate: 2,
        }
        const headers = {
            ...requestInit?.headers,
            referer: INDEX_URL.href,
        }
        requestInit = {
            ...requestInit,
            method: 'POST',
            headers: headers,
        }
        Object.entries(loginData).forEach(([key, value]) => {
            url.searchParams.set(key, value)
        })

        const resp = await request(session, url, requestInit)

        const result = await resp.json()
        if (result.errno !== 0) {
            throw new Error(`Login failed. message=${result.errmsg}`)
        }

        const userInfo = result.data.user

        return { success: true, data: userInfo} 
    } catch(err) {
        return { success: false, message: err.message}
    }
}

export async function signApi(session, token, requestInit = {}) {
    try {
        const url = new URL('https://i.zaimanhua.com/lpi/v1/task/sign_in')
        const headers = {
            ...requestInit?.headers,
            authorization: `Bearer ${token}`,
            referer: url.origin + '/',
        }

        const resp = await request(session, url, { ...requestInit, headers: headers, method: 'POST' })

        const result = await resp.json()
        if (result.errno !== 0) {
            throw new Error(`Sign-in failed. message=${result.errmsg}`)
        }

        return { success: true, message: result.errmsg}
    } catch(err) {
        return { success: false, message: err.message}
    }
}

// 也许可以刷新token
export async function userInfoApi(session, token, requestInit = {}) {
    try {
        const url = new URL('https://account-api.zaimanhua.com/v1/userInfo/get')
        const headers = {
            ...requestInit?.headers,
            authorization: `Bearer ${token}`,
            referer: INDEX_URL.href,
        }

        const resp = await request(session, url, { ...requestInit, headers: headers, method: 'GET' })

        const result = await resp.json()
        if (result.errno !== 0) {
            throw new Error(`Fetching user info failed. message=${result.errmsg}`)
        }

        return { success: true, data: result.data.userInfo }
    } catch(err) {
        return { success: true, message: err.message}
    }
}
