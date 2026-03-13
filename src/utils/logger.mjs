import path from 'node:path';
import { appendFile, mkdir } from 'node:fs/promises';
import { config } from './config.mjs';

export class Logger {
    constructor(appName) {
        this.appName = appName
        this.logDir = config?.general?.logPath;  // <string> 或 undefined
    }

    /**
     * Output logging message.
     * @async
     * @param {(string | Error)} message
     * @param {('DEBUG' | 'INFO' | 'WARN' | 'ERROR')} level
     */
    async logging(message, level = 'INFO') {
        const now = new Date()
        const allowLevels = new Set(['DEBUG', 'INFO', 'WARN', 'ERROR'])

        if (message instanceof Error) {
            message = message.stack.split('\n').slice(0, 2).map(str => str.trim()).join(' | ')
            level = 'ERROR'
        }

        const appName = this.appName ? `[${this.appName}]` : '';
        level = allowLevels.has(level.toUpperCase()) ? level.toUpperCase(): 'INFO'
        message = `[${now.toISOString()}][${level}]${appName} ${message}`
        console.log(message)

        if (!this.logDir) return;

        try {
            const logFile = path.join(this.logDir, `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}.log`);
            await mkdir(path.join(this.logDir), {recursive: true})
            await appendFile(logFile, String(message) + '\n', {mode: 0o664})
        } catch(err) {
            this.logDir = false
            await this.logging('写入日志文件时出错，已关闭日志文件输出', 'ERROR')
            await this.logging(err, 'ERROR')
        }
    }


    async debug(message) {
        await this.logging(message, 'DEBUG')
    }
    async info(message) {
        await this.logging(message, 'INFO')
    }
    async warn(message) {
        await this.logging(message, 'WARN')
    }
    async error(message) {
        await this.logging(message, 'ERROR')
    }
}

