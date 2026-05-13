import path from 'node:path'
import { mkdirSync } from 'node:fs'
import { appendFile } from 'node:fs/promises'

/**
 * @typedef {Object} InitData
 * @property {string} [logDir] - 存放日志的文件夹，缺省时不输出日志文件
 */

let logFileName
let isInit = false

/**
 * 创建日志记录实例，支持持久化存储参数
 * @param {string} label - 日志标签
 * @param {InitData} [init] - 初始化数据
 */
export function createLogger(label, init = {}) {
    if (!isInit) {
        isInit = true
        logFileName = init.logDir ? path.join(init.logDir, `${Date.now()}.log`) : null
        mkdirSync(init.logDir, { recursive: true })
    }

    return new Logger(label, logFileName)
}

/**
 * 日志记录类
 */
export class Logger {
    /**
     * @param {string} label - 日志标签
     * @param {string} [logFileName] - 日志文件名，缺省时不输出文件
     */
    constructor(label, logFileName) {
        this.appName = label
        this.fileOutput = Boolean(logFileName)
        this._levels = new Set(['DEBUG', 'INFO', 'WARN', 'ERROR'])

        this._levels.forEach((level) => {
            if (level === 'ERROR') return
            this[level.toLowerCase()] = async (message) => {
                await this.logging(message, level)
            }
        })
        this.error = async (message, error) => {
            if (error) {
                message = `${message}\n>> ${error.stack.replace(/\n/g, '\n>> ')}`
            }
            await this.logging(message, 'ERROR')
        }
    }

    async logging(message, level = 'INFO') {
        const now = new Date()
        const appTag = this.appName ? `${this.appName}: ` : ''
        level = this._levels.has(level.toUpperCase()) ? level.toUpperCase() : 'INFO'

        message = `${now.toISOString()} ${`[${level}]`.padEnd(8)}${appTag}${message}`
        console.log(message)

        if (!this.fileOutput) return

        try {
            await appendFile(logFileName, String(message) + '\n', { mode: 0o664 })
        } catch (err) {
            this.fileOutput = false
            await this.logging('Log writing failed, log file output is closed.', 'ERROR')
            await this.logging(err, 'ERROR')
        }
    }
}
