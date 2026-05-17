import { createHash } from 'node:crypto'
import { Session } from '../utils/session.mjs'
import { createLogger } from '../utils/logger.mjs'
import { loginApi, signApi, userInfoApi } from '../providers/zaimanhua.mjs'

export const taskMeta = {
    name: 'ZaiManHua',
    functions: {
        sign: signTask,
    },
}

const logger = createLogger(taskMeta.name)
const session = new Session(taskMeta.name)

function exportToken() {
    const cookieJar = session.getCookieJar()
    const token = cookieJar.getObject(taskMeta.name)?.token
    if (!token) throw new Error('Token not found.')

    return token
}

function passwdToHash(passwd) {
    const generateMD5 = (text) => createHash('md5').update(text).digest('hex')
    const md5Regex = /^[0-9a-f]{32}$/

    return md5Regex.test(passwd) ? passwd : generateMD5(passwd)
}

async function signTask(taskData, saveDataCallback) {
    try {
        taskData.password = passwdToHash(taskData.password)
        const baseInit = {
            'accept-language': 'zh-CN,zh;q=0.9,en;q=0.8',
            'user-agent': taskData.userAgent,
        }

        if (taskData.cookie) {
            session.setCookies(taskData.cookie, taskData.name)
        } else {
            const {success, message, data} = await loginApi(session, taskData.username, taskData.password, baseInit)
            if (!success) {
                logger.error(message)
                return
            }
            session.setCookies(`token=${data.token || ''}`, taskData.name)
        }

        const userInfoResult = await userInfoApi(session, exportToken(), baseInit)
        if (!userInfoResult.success) {
            logger.error(userInfoResult.message)
            return
        }
        session.setCookies(`token=${userInfoResult.data.token}`, taskMeta.name)

        const signResult = await signApi(session, exportToken(), baseInit)
        if (!signResult.success) {
            logger.error(signResult.message)
            return
        } else {
            logger.info(`Sign-in successful. Message=${signResult.message}`)
        }
    } catch (err) {
        logger.error('Unexpected error.', err)
    } finally {
        taskData.cookie = session.getCookies(taskMeta.name)
        if (saveDataCallback) {
            saveDataCallback(taskData)
        }
    }

}
