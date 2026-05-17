import { Session } from '../utils/session.mjs'
import { createLogger } from '../utils/logger.mjs'
import { dsuSignApi, checkLogin } from '../providers/discuz.mjs'

export const taskMeta = {
    name: 'AnimeSubs',
    functions: {
        sign: signTask,
    },
}

const HOME_URL = new URL('https://bbs.acgrip.com')
const logger = createLogger(taskMeta.name)
const session = new Session(taskMeta.name)

export async function signTask(taskData, saveDataCallback) {
    try {
        session.setCookies(taskData.cookie, taskMeta.name)

        const init = {}
        init.headers = {
            'accept-language': 'zh-CN,zh;q=0.9,en;q=0.8',
            'content-type': 'application/x-www-form-urlencoded',
            'user-agent': taskData.userAgent,
        }

        const loginStatus = await checkLogin(session, HOME_URL, init)
        if (!loginStatus) {
            logger.error('Login failed.')
            return
        }
    
        const signResult = await dsuSignApi(session, HOME_URL, { requestInit: init, signOptions: taskData.signOptions })
        if (signResult.errno === 0) {
            logger.info(`Sign-in successful. Message=${signResult.message}`)
        } else {
            logger.error(`Sign-in failed. Message=${signResult.message}`)
            return
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
