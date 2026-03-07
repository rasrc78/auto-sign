import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { logging } from './utils/logging.mjs';

const CONFIG_PATH = './configs.json';
let configs = { log: false, time: '00:00:00' };  // 默认值

// const myUserAgent = {
//     desktop: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36',
//     mobile: 'Mozilla/5.0 (Android 14; Mobile; rv:141.0) Gecko/141.0 Firefox/141.0'
// };

async function main() {
    try {
        const userConfigs = await getConfigs(CONFIG_PATH);
        configs = Object.assign(configs, userConfigs)
    } catch (err) {
        logging('Failed to read configuration file.', 'ERROR', {fileOutput: configs.log})
        throw err;
    }
    
    const servicesNames = Object.keys(configs.services);
    for (const name of servicesNames) {
        let passwd = configs.services[name].password;
        if (passwd) {
            configs.services[name].password = await passwdToHash(passwd, name)
        }
    }

    let schedulePolicy = {
        getNextRunTime(now) {
            const nowDate = new Date(now);
            return new Date(nowDate.getFullYear(), nowDate.getMonth(), nowDate.getDate() + 1, ...(configs.time.split(':'))).getTime();
        }
    };

    let task = {
        async run() {
            for (const name of servicesNames) {
                const service = await import(`./services/${name}.mjs`)
                const result = await service.runTask(configs.services[name]);  // 会返回 Cookie 字符串。
                configs.services[name].cookie = result
                logging(`Successfully executed sign-in task for ${name}.`, 'INFO', {fileOutput: configs.log})
            }
        },
        async onError(err) {
            logging(err, 'ERROR', {fileOutput: configs.log})
        },
        async onComplete() {
            await setConfigs(CONFIG_PATH, configs)
        }
    }
    
    const schedule = createScheduler({task, schedulePolicy})
    schedule.start()
    schedule.runOnce()
}

/**
 * @async
 * @param {PathLike} configFile 
 * @param {object} configs
 */
async function setConfigs(configFile, configs = {}) {
    writeFile(configFile, JSON.stringify(configs, null, 2), {encoding:'utf-8', mode: 0o664})
} 

/**
 * @async
 * @param {PathLike} configFile 
 * @returns {Promise<object>}
 */
async function getConfigs(configFile) {
    const configs = JSON.parse(await readFile(configFile, {encoding: 'utf-8'}));
    return configs;
} 

async function passwdToHash(passwd, serviceName) {
    const loggingError = (err) => logging(err, 'ERROR', {fileOutput: configs.log})
    const generateMD5 = (text) => createHash('md5').update(text).digest('hex');

    const md5Regex = /^[0-9a-f]{32}$/i;
    const converter = {
        zaimanhua(passwd) {
            return md5Regex.test(passwd) ? passwd : generateMD5(passwd);
        }
    };

    if (!converter[serviceName]) {
        const err = new Error(`No password processing rules for "${serviceName}" could be found.`)
        loggingError(err)
        throw err;
    }

    const hash = converter[serviceName](passwd);
    if (!hash) {
        const err = new Error('Error in processing password.')
        loggingError(err)
        throw err;
    }
    
    return hash;
}

/**
 * 
 * @param {object} param0
 * @param {object} param0.task
 * @param {Function} param0.task.run
 * @param {Function} param0.task.onError
 * @param {Function} param0.task.onComplete
 * @param {object} param0.schedulePolicy
 * @param {Function} param0.schedulePolicy.getNextRunTime
 * @returns 
 */
function createScheduler({task, schedulePolicy}) {
    let timerId = null;
    let active = false;
    let lastRunAt = null;
    let nextRunAt = null;

    function scheduleNext() {
        if (!active) return;

        const now = Date.now();
        nextRunAt = schedulePolicy.getNextRunTime(now);
        const delay = Math.max(0, nextRunAt - now);

        timerId = setTimeout(onTimeout, delay)
    }

    async function onTimeout() {
        if (!active) return;

        lastRunAt = Date.now()

        try {
            await task.run()
        } catch(err) {
            await task.onError(err)
        } finally {
            await task.onComplete()
            scheduleNext()
        }
    }

    return {
        start() {
            if (active) return;
            active = true
            scheduleNext()
        },
        stop() {
            active = false
            if (timerId) {
                clearTimeout(timerId)
                timerId = null
            }
        },
        nextRun() { return nextRunAt; },
        lastRun() { return lastRunAt; },
        async runOnce() { await onTimeout() }
    }
}

await main()
