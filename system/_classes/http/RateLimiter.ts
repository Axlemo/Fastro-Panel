import { RateLimitEvent } from "../../_types";

export default class RateLimiter {
    private limiterData = new Map<string, RateLimitEvent>();

    public checkRate(id: string, maxRateCount: number, timeout: number, preserveRate = true): boolean {
        const meta = this.limiterData.get(id);
        const date = Date.now();

        if (!meta) {
            this.limiterData.set(id, {
                hits: 1,
                nextReset: date + timeout,
                resetTimeout: timeout,
            });
        }
        else {
            if (date >= meta.nextReset && meta.hits > 0) {
                // Calculate how many hits to deduct based on the time that has passed
                // Must be a whole number, so we round the result
                const deductions = (date - meta.nextReset) / meta.resetTimeout;
                meta.hits -= Math.round(deductions);
                if (meta.hits < 1) meta.hits = 1;
                meta.nextReset = date + meta.resetTimeout;
            }
            else {
                if (!preserveRate) meta.nextReset = date + meta.resetTimeout;

                if (meta.hits >= maxRateCount) {
                    this.limiterData.set(id, meta);
                    return true;
                }
                else {
                    meta.hits++;
                }
            }

            this.limiterData.set(id, meta);
        }

        return false;
    }

    public checkTimeout(id: string, maxRateCount: number, preserveRate: boolean = true): number {
        const meta = this.limiterData.get(id);
        const date = Date.now();

        if (meta && meta.hits >= maxRateCount && date < meta.nextReset) {
            if (!preserveRate) meta.nextReset = date + meta.resetTimeout;
            this.limiterData.set(id, meta);
            return meta.nextReset - date;
        }

        return 0;
    }
}