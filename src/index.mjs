import { readFileSync, writeFileSync } from 'node:fs'
import { createLogger } from './utils/logger.mjs'
import { Scheduler } from './utils/scheduler.mjs'

const CONFIG_PATH = './config.json'
const CONFIG_ENCODING = 'UTF-8'

function init() {
    const config = loadConfig()
    const logger = createLogger('Main', { logDir: config.general?.logPath })

    return { config: config, logger: logger }
}

function loadConfig() {
    const userConfig = JSON.parse(readFileSync(CONFIG_PATH, { encoding: CONFIG_ENCODING }))
    return userConfig
}

function saveConfig(config = {}) {
    writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2), { encoding: CONFIG_ENCODING, mode: 0o664 })
}

// 初始化配置、日志记录
const { config, logger } = init()

async function main() {
    const onSchedulerError = (err) => {
        logger.error('Unexpected error in Scheduler.', err)
    }

    const taskRunner = async (taskConfig, index) => {
        const saveTaskData = (taskData) => {
            config.tasks[index].data = taskData
            saveConfig(config)
            logger.info('Task Config updated.')
        }
        try {
            if (!taskConfig.source || !taskConfig.function) {
                logger.error('Task creating failed. Incomplete task config.')
                return
            }
            const taskSource = await import(`./tasks/${taskConfig.source}.mjs`)

            const taskMeta = taskSource.taskMeta
            if (!taskMeta) {
                logger.error('Task creating failed. Task Metadata not found in task source.')
                return
            }
            if (!taskMeta.functions.hasOwnProperty(taskConfig.function)) {
                logger.error('Task creating failed. Function not found in task source.')
                return
            }

            const scheduler = new Scheduler(() => taskMeta.functions[taskConfig.function](taskConfig.data, saveTaskData), taskConfig.cron, {
                onError: onSchedulerError,
                immediately: taskConfig.immediately || false,
            })
            scheduler.start()

        } catch (err) {
            if (err.code === 'ERR_MODULE_NOT_FOUND') {
                logger.error('Task creating failed. Task source file not found.')
                return
            } else {
                throw err
            }
        }
    }
    await Promise.all(config.tasks.map(taskRunner))
}

try {
    await main()
} catch (err) {
    logger.error('FATAL ERROR.', err)
    process.exit(1)
}
