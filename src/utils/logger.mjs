import path from 'node:path';
import { appendFile, mkdir } from 'node:fs/promises';
import { loadConfig } from './config.mjs';

const config = loadConfig();
const LOG_DIR = config?.general?.logPath;  // <string> 或 undefined
const LOG_FILE_NAME = path.join(LOG_DIR, `${Date.now()}.log`);

export class Logger {
    constructor(appName) {
        this.appName = appName
        this.fileOutput = LOG_DIR ? true : false
        this._levels = new Set(['DEBUG', 'INFO', 'WARN', 'ERROR'])

        this._levels.forEach((level) => {
            this[level.toLowerCase()] = async (message, detail) => {
                await this.logging(`${message} ${this._formatDetail(detail, level)}`.trim(), level)
            }
        })

    }

    /**
     * Output logging message.
     * @async
     * @param {(string | Error)} message
     * @param {('DEBUG' | 'INFO' | 'WARN' | 'ERROR')} level
     */
    async logging(message, level = 'INFO') {
        const now = new Date();
        const appTag = this.appName ? `${this.appName}: ` : '';
        level = this._levels.has(level.toUpperCase()) ? level.toUpperCase(): 'INFO'

        message = `${now.toISOString()} ${`[${level}]`.padEnd(8)}${appTag}${message}`
        console.log(message)

        if (!this.fileOutput) return;

        try {
            await mkdir(path.join(LOG_DIR), { recursive: true })
            await appendFile(LOG_FILE_NAME, String(message) + '\n', { mode: 0o664 })
        } catch(err) {
            this.fileOutput = false
            await this.logging('写入日志文件时出错，已关闭日志文件输出', 'ERROR')
            await this.logging(err, 'ERROR')
        }
    }


    _formatDetail(detail, level = 'INFO') {
        if (!detail) return '';
        if (detail instanceof Error) {
            const errSummary = JSON.stringify({
                errName: detail.name || 'Error',
                errMsg: detail.message
            });
            const errStack = level === 'ERROR' ? `\n${detail.stack}` : '';
            return `${errSummary}${errStack}`;
        }
        if (typeof detail === 'object') return JSON.stringify(detail);
        return String(detail)
    }
}
