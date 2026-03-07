import { appendFile } from 'node:fs/promises';


/**
 * Output logging message.
 * @async
 * @param {(string | Error)} content
 * @param {('DEBUG' | 'INFO' | 'WARN' | 'ERROR')} level 
 * @param {object} options 
 * @param {boolean} options.fileOutput
 */
export async function logging(content, level = 'INFO', options = {}) {
    const now = new Date()
    const fileOutput = options.fileOutput || false;
    const allLevel = new Set(['DEBUG', 'INFO', 'WARN', 'ERROR'])

    if (content instanceof Error) {
        content = content.stack.split('\n').slice(0, 2).map(str => str.trim()).join(' | ')
        level = 'ERROR'
    }

    level = allLevel.has(level.toUpperCase()) ? level.toUpperCase(): 'INFO'
    content = `[${now.toISOString()}][${level}] ${content}`
    console.log(content)

    if (!fileOutput) return;
    const logFile = `./debug.log`  // 总有一天会出问题。
    // const logFile = `../log-${now.getFullYear()}-${now.getMonth()}-${now.getDate()}.log`

    try {
        await appendFile(logFile, String(content) + '\n', {mode: 0o664})
    } catch(err) {
        await logging(err, 'ERROR', {...options, fileOutput: false})
    }
}