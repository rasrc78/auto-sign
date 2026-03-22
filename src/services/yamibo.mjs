import { Session } from '../utils/session.mjs'
import { Logger } from '../utils/logger.mjs';
import { zqljSign, checkLogin } from '../utils/discuz.mjs';

const logger = new Logger('Yamibo');
const cookieId = 'yamibo';
const session = new Session(cookieId);
const indexUrl = new URL('https://bbs.yamibo.com');


async function sign(init = {}) {
    try {
        const signMsg = await zqljSign(session, indexUrl, {init: init});
        if (signMsg.errno === 0) {
            logger.info(`签到成功 | Message: ${signMsg.message}`)
        } else {
            throw Error(`Error Message: ${signMsg.message}`);
        }
    } catch(err) {
        logger.error(`签到时发生错误`)
        throw err;
    }
}

export async function runTask(taskConfig) {
    try {
        session.setCookies(taskConfig.cookie, cookieId)
        let init = {};
        init.headers = {
            'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
            'accept-language': 'zh-CN,zh;q=0.9,en;q=0.8',
            'user-agent': taskConfig.userAgent
        }

        const loginStatus = await checkLogin(session, indexUrl, {init: init});
        if (!loginStatus) throw new Error('登录失败');

        await sign(init);


    } catch (err) {
        logger.error(err)
        throw new Error('签到任务执行失败：百合会');
    } finally {
        taskConfig.cookie = session.getCookies(cookieId)
        return taskConfig;
    }
}