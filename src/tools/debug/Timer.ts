

export class Timer {
    private timers: Map<string, number> = new Map();
    timeLogs: Map<string, number> = new Map();

    timeStart (name: string) {
        const now = this.now();
        this.timers.set(name, now);
    }

    timeEnd (name: string) {
        const prev = this.timers.get(name);
        if (prev) {
            const now = this.now();
            const d = now - prev;
            this.timeLogs.set(name, d);
            return d;
        }
        return 0;
    }
    
    now () {
        return performance ? performance.now() : Date.now();
    }
}