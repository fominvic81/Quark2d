import { Events } from '../../common/Events';

interface RunnerOptions {
    tps?: number;
}

/**
 * The 'Runner' is a class that provides a loop.
 */

export class Runner {
    fixedTps: number = 60;
    fixedDelta: number = 1 / this.fixedTps;
    tps: number = 0;
    delta: number = 0;
    deltaAccumulator: number = 0;
    fps: number = 0;
    renderDelta: number = 0;

    renderTime: number = performance.now() / 1000;
    time: number = performance.now() / 1000;

    events: Events = new Events();
    event = {
        time: 0,
        delta: 0,
        tps: 0,
    }
    renderEvent = {
        time: 0,
        delta: 0,
        fps: 0,
    }

    enabled: boolean = false; 
    enabledRender: boolean = false;

    tickRequestId: number = 0;
    renderRequestId: number = 0;

    constructor (options: RunnerOptions = {}) {
        if (options.tps) this.setTps(options.tps);
    }

    /**
     * Starts the loop.
     */
    run () {
        if (this.enabled) return;
        this.enabled = true;
        this.time = performance.now() / 1000 - this.fixedDelta;
        this.tick();
    }

    /**
     * Stops the loop.
     */
    stop () {
        this.enabled = false;
        if (this.tickRequestId) window.cancelAnimationFrame(this.tickRequestId);
    }

    tick () {
        this.tickRequestId = window.requestAnimationFrame(() => {this.tick()});
        const now = performance.now() / 1000;
        this.delta = now - this.time;
        this.tps = 1 / this.delta;
        this.time = now;

        this.event.time = this.time;
        this.event.delta = this.delta;
        this.event.tps = this.tps;

        this.events.trigger('before-tick', [this.event]);
        this.events.trigger('tick', [this.event]);

        this.deltaAccumulator += this.delta;
        this.deltaAccumulator = Math.min(this.deltaAccumulator, this.fixedDelta * 5);

        while (this.deltaAccumulator > this.fixedDelta) {
            this.deltaAccumulator -= this.fixedDelta;

            this.event.time = this.time - this.deltaAccumulator;
            this.event.delta = this.fixedDelta;
            this.event.tps = this.fixedTps;
            
            this.events.trigger('before-update', [this.event]);
            this.events.trigger('update', [this.event]);
            this.events.trigger('after-update', [this.event]);
        }

        this.events.trigger('before-tick', [this.event]);

    }

    /**
     * Sets count of updates per second.
     * @param tps
     */
    setTps (tps: number) {
        this.fixedTps = tps;
        this.fixedDelta = 1 / tps;
    }

    /**
     * Starts the rendering loop.
     */
    runRender () {
        if (this.enabledRender) return;
        this.enabledRender = true;
        this.renderTime = performance.now() - this.renderDelta;
        this.render();
    }

    /**
     * Stops the rendering loop.
     */
    stopRender () {
        this.enabledRender = false;
        if (this.renderRequestId) window.cancelAnimationFrame(this.renderRequestId);
    }

    render () {
        this.renderRequestId = window.requestAnimationFrame(() => {this.render()});

        const now = performance.now() / 1000;
        this.renderDelta = now - this.renderTime;
        this.fps = 1 / this.renderDelta;
        this.renderTime = now;

        this.renderEvent.time = this.renderTime;
        this.renderEvent.delta = this.renderDelta;
        this.renderEvent.fps = this.fps;

        this.events.trigger('before-render', [this.renderEvent]);
        this.events.trigger('render', [this.renderEvent]);
        this.events.trigger('after-render', [this.renderEvent]);
    }
}