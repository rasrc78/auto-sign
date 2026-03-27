import { Session } from '../utils/session.mjs';
import { Logger } from '../utils/logger.mjs';
import { dsuSign, checkLogin } from '../utils/discuz.mjs';

const COOKIE_ID = 'animesubs';

const logger = new Logger('AnimeSubs');
const session = new Session(COOKIE_ID);
const indexUrl = new URL('https://bbs.acgrip.com');

async function sign(options = {}) {
    const signMsg = await dsuSign(session, indexUrl, options);

    if (signMsg.errno === 0) {
        logger.info(`Sign-in successful.`, signMsg)
    } else {
        logger.error(`Sign-in failed.`, signMsg)
        return;
    }
}

export async function runTask(taskConfig) {
    try {
        session.setCookies(taskConfig.cookie, COOKIE_ID)

        let init = {};
        init.headers = {
            'accept-language': 'zh-CN,zh;q=0.9,en;q=0.8',
            "content-type": "application/x-www-form-urlencoded",
            'user-agent': taskConfig.userAgent
        }

        const loginStatus = await checkLogin(session, indexUrl, { init });
        if (!loginStatus) {
            logger.error('Login failed.')
            return;
        }
        await sign({ init, signOptions: taskConfig.signOptions })

    } catch(err) {
        logger.error('Unexpected error.', err)
    }

    taskConfig.cookie = session.getCookies(COOKIE_ID)
    return taskConfig;
}