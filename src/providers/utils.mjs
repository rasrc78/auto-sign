import { Session } from "../utils/session.mjs"

export async function request(session, url, requestInit) {
    if (!(session instanceof Session)) {
        throw new Error('session is not instance of Session')
    }

    const resp = await session.fetch(url, requestInit)
    if (!resp.ok) {
        throw new Error(`HTTP Error. Status=${resp.status},URL=${resp.url.replace(/\?.+/, '')}`)
    }

    return resp
}
