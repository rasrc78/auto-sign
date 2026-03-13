import { readFileSync, writeFileSync } from 'node:fs';

const CONFIG_PATH = './config.json';

export const config = loadConfig();

function loadConfig(configPath) {
    const defaultConfig = {
        general: {
            schedule: '00:00:00'
        }
    }

    let userConfig;
    try {
        userConfig = JSON.parse(readFileSync(CONFIG_PATH, {encoding: 'utf-8'}))
    } catch(err) {
        console.error('配置文件不存在')
        throw err;
    }

    return {...defaultConfig, ...userConfig};
}

export const saveConfig = (config = {}) => {
    writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2), {encoding:'utf-8', mode: 0o664})
};
