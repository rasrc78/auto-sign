import { loadConfig, saveConfig } from './utils/config.mjs';
import { Logger } from './utils/logger.mjs';
import { Scheduler } from './utils/scheduler.mjs';

let config = loadConfig();
const logger = new Logger('Main');


async function main() {
    const serviceNames = Object.keys(config).filter(v => v !== 'general');

    const schedulePolicy = {
        getNextRunTime(now) {
            const nowDate = new Date(now);
            return new Date(nowDate.getFullYear(), nowDate.getMonth(), nowDate.getDate() + 1, ...(config.general.schedule.split(':'))).getTime();
        }
    };

    const taskPolicy = {
        async run() {
            const tasks = serviceNames.map(async (name) => {
                const service = await import(`./services/${name}.mjs`)
                const taskReturn = await service.runTask(config[name]); // 预期是返回该服务的配置文件

                if (taskReturn) {
                    config[name] = taskReturn
                }

                logger.info('任务执行完成', { service_name: name })
            })

            await Promise.allSettled(tasks)
        },
        async onError(err) {
            logger.error('Unexpected error.', err)
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
    logger.error('Unexpected error.', err)
    process.exit(1);
}