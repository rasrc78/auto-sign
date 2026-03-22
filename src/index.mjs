import { config, saveConfig } from './utils/config.mjs';
import { Logger } from './utils/logger.mjs';
import { Scheduler } from './utils/scheduler.mjs'

const logger = new Logger('Main');

async function main() {
    const serviceNames = Object.keys(config).filter(v => v !== 'general');
    const serviceToChinese = {
        zaimanhua: '再漫画',
        yamibo: '百合会',
        acgripcom: 'Anime字幕论坛'
    }

    const schedulePolicy = {
        getNextRunTime(now) {
            const nowDate = new Date(now);
            return new Date(nowDate.getFullYear(), nowDate.getMonth(), nowDate.getDate() + 1, ...(config.general.schedule.split(':'))).getTime();
        }
    };

    const taskPolicy = {
        async run() {
            for (const name of serviceNames) {
                const service = await import(`./services/${name}.mjs`)
                const taskReturn = await service.runTask(config[name]);
                if (taskReturn) {
                    config[name] = taskReturn
                }

                logger.info(`签到任务执行成功：${serviceToChinese[name]}`)
            }
        },
        async onError(err) {
            logger.error(err)
        },
        async onComplete() {
            saveConfig(config)
        }
    }
    
    const scheduler = new Scheduler(taskPolicy, schedulePolicy)
    scheduler.start()
    scheduler.execTask()
}

try {
    await main()
} catch(err) {
    logger.error(err)
}