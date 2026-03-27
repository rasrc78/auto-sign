import { readFileSync, writeFileSync } from 'node:fs';

const CONFIG_PATH = './config.json';

export function loadConfig() {
    const defaultConfig = {
        general: {
            schedule: '00:00:00'
        }
    }
    const userConfig = JSON.parse(readFileSync(CONFIG_PATH, { encoding: 'utf-8' }))

    return {...defaultConfig, ...userConfig};
}

export function saveConfig(config = {}) {
    writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2), { encoding:'utf-8', mode: 0o664 })
}
