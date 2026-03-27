import { Session } from '../utils/session.mjs';
import { Logger } from '../utils/logger.mjs';
import { zqljSign, checkLogin } from '../utils/discuz.mjs';

const COOKIE_ID = 'yamibo';

const logger = new Logger('Yamibo');
const session = new Session(COOKIE_ID);
const indexUrl = new URL('https://bbs.yamibo.com');


async function sign(init = {}) {
    const signMsg = await zqljSign(session, indexUrl, {init: init});

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
            'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
            'accept-language': 'zh-CN,zh;q=0.9,en;q=0.8',
            'user-agent': taskConfig.userAgent
        }

        const loginStatus = await checkLogin(session, indexUrl, { init });
        if (!loginStatus) {
            logger.error('Login failed.')
            return;
        }

        await sign(init)

    } catch(err) {
        logger.error('Unexpected error.', err)
    }

    taskConfig.cookie = session.getCookies(COOKIE_ID)
    return taskConfig;
}
