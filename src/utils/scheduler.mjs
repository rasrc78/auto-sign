export class Scheduler {
    /**
     * @typedef {Object} TaskPolicy
     * @property {() => Promise<void>} run - 执行主任务
     * @property {(err: Error) => Promise<void>} [onError] - catch 块回调函数 | 注意：不会捕捉此函数的错误
     * @property {() => Promise<void>} [onComplete] - finally 块回调函数 | 注意：不会捕捉此函数的错误
     */

    /**
     * @typedef {Object} SchedulePolicy
     * @property {() => number} getNextRunTime - 获取下次执行的时间戳
     */

    /**
     * 执行任务调度
     * @param {TaskPolicy} taskPolicy - 任务逻辑策略
     * @param {SchedulePolicy} schedulePolicy - 调度频率策略
     */
    constructor(taskPolicy, schedulePolicy) {
        this.task = taskPolicy
        this.policy = schedulePolicy
        this.timerId = null;
        this.active = false;
        this.lastRunAt = null;
        this.nextRunAt = null;
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
        if (!this.active) return;

        const now = Date.now();
        this.nextRunAt = this.policy.getNextRunTime(now);
        const delay = Math.max(0, this.nextRunAt - now);

        this.timerId = setTimeout(this._onTimeout, delay)
    }
    
    async _onTimeout() {
        if (!this.active) return;

        this.lastRunAt = Date.now()

        try {
            await this.execTask()
        } finally {     
            this._scheduleNext()
        }
    }

    async execTask() {
        try {
            await this.task.run()
        } catch(err) {
            if (this.task.onError) await this.task.onError(err)
        } finally {
            if (this.task.onComplete) await this.task.onComplete()
        }
    }
}
