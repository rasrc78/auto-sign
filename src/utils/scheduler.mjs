export class Scheduler {
    /**
     * @param {object} taskPolicy
     * @param {Function} taskPolicy.run - Async
     * @param {Function} taskPolicy.onError - Optional / Async
     * @param {Function} taskPolicy.onComplete - Optional / Async
     * @param {object} schedulePolicy
     * @param {Function} schedulePolicy.getNextRunTime
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
