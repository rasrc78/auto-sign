/**
 * 定时任务调度器类
 */
export class Scheduler {
    /**
     * @typedef {Object} Options
     * @property {function(Error)} onError - 任务发生未捕获错误时的回调，缺省时忽略错误
     * @property {boolean} immediately - 启动调度器时立即执行一次任务（鸽）
     */

    /**
     * 创建一个调度器实例
     * @param {Function} task - 任务运行函数
     * @param {string} cron - 不标准实现的 POSIX Cron 表达式
     * @param {Options} [options]
     */
    constructor(task, cron, options = {}) {
        this.task = task
        this.cron = cron
        this.onError = options.onError
        this.immediately = options.immediately
        this.getNextTime = parseCron(this.cron)
        this.timerId = null
        this.active = false
        this.lastRunAt = null
        this.nextRunAt = null
    }

    start() {
        if (!this.active) {
            this.active = true
            this._scheduleNext()
        }
    }

    stop() {
        this.active = false
        if (this.timerId) {
            clearTimeout(this.timerId)
            this.timerId = null
        }
    }

    _scheduleNext() {
        if (!this.active) return

        const now = Date.now()
        this.nextRunAt = this.getNextTime(now)
        const delay = Math.max(0, this.nextRunAt - now)

        this.timerId = setTimeout(() => this._onTimeout(), delay)
    }

    async _onTimeout() {
        if (!this.active) return

        this.lastRunAt = Date.now()

        try {
            await this.task()
        } catch(err) {
            if (this.onError) {
                this.onError(err)
            }
        } finally {
            this._scheduleNext()
        }
    }
}

/**
 * 解析Cron表达式
 */
function parseCron(cron) {
    cron = cron.split(' ')

    const minutes = _parseCronSection(cron[0], 0, 59)
    const hours = _parseCronSection(cron[1], 0, 23)
    const dayOfMonth = _parseCronSection(cron[2], 1, 31) // Why are only you not 0-based?
    const month = _parseCronSection(cron[3], 1, 12).map((month) => (month !== undefined ? month - 1 : month))
    const dayOfWeek = _parseCronSection(cron[4], 0, 6)

    return function (lastTimestamp, resetSec = true) {
        const time = new Date(lastTimestamp)

        const setTime = (thisDate, unit, value) => {
            if (!(thisDate instanceof Date)) throw new Error('Instance is not Date')

            const timeMethods = {
                year: thisDate.setFullYear,
                month: thisDate.setMonth,
                day: thisDate.setDate,
                hour: thisDate.setHours,
                minute: thisDate.setMinutes,
            }

            if (timeMethods[unit]) {
                timeMethods[unit].call(thisDate, value)
            }
        }

        const getTime = (thisDate, unit) => {
            if (!(thisDate instanceof Date)) throw new Error('Instance is not Date')

            const timeMethods = {
                year: thisDate.getFullYear,
                month: thisDate.getMonth,
                day: thisDate.getDate,
                hour: thisDate.getHours,
                minute: thisDate.getMinutes,
            }

            if (timeMethods[unit]) {
                return timeMethods[unit].call(thisDate)
            }
        }

        const resetTime = (thisDate, units = []) => {
            units.forEach((unit) => {
                // if (unit === 'day') thisDate.setDate(dayOfMonth[0])
                if (unit === 'day') thisDate.setDate(1)
                if (unit === 'hour') thisDate.setHours(hours[0])
                if (unit === 'minute') thisDate.setMinutes(minutes[0])
            })
        }

        const setNextValue = (thisDate, unit, values = [], length, offset = 0) => {
            const currentValue = getTime(thisDate, unit)
            // const nextValue = (values.find((v) => v > currentValue) || values[0] + length) + offset // 虽然这里不改也无大碍，find()结果为0时，索引0也是0
            const foundValue = values.find((v) => v > currentValue)
            const nextValue = (foundValue === undefined ? values[0] + length : foundValue) + offset

            setTime(thisDate, unit, nextValue)
        }

        let i = 50
        while (i) {
            i--
            if (!i) {
                throw new Error(`Matching date failed. Cron=${cron}`)
            }

            if (!month.includes(time.getMonth())) {
                setNextValue(time, 'month', month, 12)
                resetTime(time, ['day', 'hour', 'minute'])
                continue
            }

            // 当日期和星期任意一项为`*`时，使用 AND 逻辑，否则使用 OR 逻辑
            const domMatch = dayOfMonth.includes(time.getDate()) // 0-based 对齐
            const dowMatch = dayOfWeek.includes(time.getDay())
            const isIgnored = cron[2] !== '*' && cron[4] !== '*'
            if (isIgnored ? !(domMatch || dowMatch) : !(domMatch && dowMatch)) {
                // 这里因为自动进位，会和 month 校验打架，但是跑起来没问题
                // 另外还有一处打架的地方在 resetTime 的 setDate
                if (isIgnored) {
                    time.setDate(time.getDate() + 1)
                } else {
                    setNextValue(time, 'day', dayOfMonth, 31)
                }

                resetTime(time, ['hour', 'minute'])
                continue
            }

            if (!hours.includes(time.getHours())) {
                setNextValue(time, 'hour', hours, 24)
                resetTime(time, ['minute'])
                continue
            }

            if (!minutes.includes(time.getMinutes()) || new Date().getMinutes() === time.getMinutes()) {
                setNextValue(time, 'minute', minutes, 60)
                continue
            }
            break
        }

        if (resetSec) {
            time.setSeconds(0)
            time.setMilliseconds(0)
        }
        return time.getTime()
    }
}

function _parseCronSection(section, min, max) {
    // const allowValue = new Array(length).fill(false)
    const allowValue = []

    if (section === undefined) {
        console.error('Expresstion Error.')
        return
    }

    for (const part of section.split(',')) {
        if (section === '') {
            console.error('Expresstion Error.')
            return
        }

        let range, step
        if (part.includes('/')) {
            ;[range, step] = part.split('/')
            step = Number(step)
        } else {
            range = part
            step = 1
        }
        if (step <= 0) {
            console.error('Expresstion Error.')
            return
        }

        let start, end
        if (range === '*') {
            ;[start, end] = [min, max]
        } else if (range.includes('-')) {
            ;[start, end] = range.split('-').map(Number)
        } else if (/^\d+$/.test(range)) {
            start = end = Number(range)
        } else {
            console.error('Expresstion Error.')
            return
        }

        if (start < min || end > max || start > end) {
            console.error('Expresstion Error.')
            return
        }

        for (let i = start; i <= end; i += step) {
            // allowValue[i] = true
            allowValue.push(i)
        }
    }

    return [...new Set(allowValue)].sort((a, b) => a - b)
}