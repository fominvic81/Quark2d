import { Common } from '../../common/Common';
import { Events } from '../../common/Events';

export enum RunnerType {
    /**
     * Fixed delta
     */
    fixed,
    /**
     * Dynamic delta
     */
    dynamic,
}

export interface RunnerOptions {
    tps?: number;
    type?: RunnerType;
    timescale?: number;
    correction?: boolean;
}

/**
 * The 'Runner' is a class that provides a loop.
 * 
 * Events:
 * * before-update
 * * update
 * * after-update
 * * before-render
 * * render
 * * after-render
 */

export class Runner extends Events {
    options: {
        type: RunnerType;
        fixedTps: number;
        fixedDelta: number;
        timescale: number;
        correction: boolean;
    };
    tps: number = 0;
    delta: number = 0;
    deltaAccumulator: number = 0;
    deltas: number[] = [];
    deltasSize: number = 40;
    lag: number = 0;

    fps: number = 0;
    renderDelta: number = 0.01;

    renderTime: number = performance.now() / 1000;
    time: number = performance.now() / 1000;
    worldTime: number = 0;

    private event = {
        time: 0,
        delta: 0,
        tps: 0,
    }
    private renderEvent = {
        time: 0,
        delta: 0,
        tps: 0,
    }

    enabled: boolean = false; 
    enabledRender: boolean = false;

    private tickRequestId: number = 0;
    private renderRequestId: number = 0;

    static LAG_C = 0.1;
    static DELTA_C = 0.4;
    static AVERAGE_C = 0.3;
    static MIN_C = 1 - (Runner.DELTA_C + Runner.AVERAGE_C);

    constructor (options: RunnerOptions = {}) {
        super();

        this.options = {
            type: options.type ?? RunnerType.fixed,
            fixedTps: 60,
            fixedDelta: 1/60,
            timescale: options.timescale ?? 1,
            correction: options.correction ?? true,
        }
        if (options.tps) this.setTps(options.tps);
    }

    /**
     * Starts the loop.
     */
    run () {
        if (this.enabled) return;
        this.enabled = true;
        this.time = performance.now() / 1000 - this.options.fixedDelta;
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

        switch (this.options.type) {
            case RunnerType.fixed:
                this.deltaAccumulator += this.delta * this.options.timescale;
                this.deltaAccumulator = Math.min(this.deltaAccumulator, Math.max(this.options.fixedDelta, 0.016666666666666666) * 1.5 * Math.max(this.options.timescale, 1));

                while (this.deltaAccumulator > this.options.fixedDelta) {
                    this.deltaAccumulator -= this.options.fixedDelta;
                    this.worldTime += this.options.fixedDelta;

                    this.event.time = this.worldTime - this.deltaAccumulator;
                    this.event.delta = this.options.fixedDelta;
                    this.event.tps = Math.min(this.options.fixedTps, this.tps);
                    this.renderEvent.tps = this.event.tps;

                    this.trigger('before-update', [this.event]);
                    this.trigger('update', [this.event]);
                    this.trigger('after-update', [this.event]);
                }
                break
            case RunnerType.dynamic:
                if (this.options.correction) {
                    const d = this.delta;

                    let min = 1 / 60;
                    let average = 1 / 60;
                    for (const delta of this.deltas) {
                        average += delta;
                        min = Math.min(delta, min);
                    }
                    average /= (this.deltas.length + 1);

                    this.delta =
                    Common.clamp(this.delta, average*0.5, average*1.5) * Runner.DELTA_C +
                    average * Runner.AVERAGE_C +
                    min * Runner.MIN_C +
                    this.lag * Runner.LAG_C;

                    this.delta = Math.min(this.delta, 0.1);

                    this.lag += d - this.delta;
                } else {
                    this.delta = Math.min(this.delta, 0.1);
                }

                let iters, delta;
                if (this.options.timescale > 1) {
                    iters = Math.trunc(this.options.timescale);
                    const r = (this.options.timescale - iters) / iters;
                    delta = this.delta * (r + 1);
                } else {
                    iters = 1;
                    delta = this.delta * this.options.timescale;
                }

                for (let i = 0; i < iters; ++i) {
                    this.worldTime += delta;

                    this.event.time = this.worldTime;
                    this.event.delta = delta;
                    this.event.tps = this.tps;
                    this.renderEvent.tps = this.event.tps;

                    this.trigger('before-update', [this.event]);
                    this.trigger('update', [this.event]);
                    this.trigger('after-update', [this.event]);
                }
                this.deltas.push(delta);
                if (this.deltas.length > this.deltasSize) {
                    this.deltas.shift();
                }
                break;
        }
    }

    /**
     * Sets count of updates per second.
     * @param tps
     */
    setTps (tps: number) {
        this.options.fixedTps = tps;
        this.options.fixedDelta = 1 / tps;
    }

    /**
     * Single step.
     * @param delta
     */
    singleStep (delta: number = this.options.fixedDelta) {
        if (this.enabled) return console.warn('Single step can be called only when loop is disabled');
        this.worldTime += delta;

        this.event.time = this.worldTime;
        this.event.delta = delta;
        this.event.tps = 1 / delta;
        this.renderEvent.tps = this.event.tps;

        this.trigger('before-update', [this.event]);
        this.trigger('update', [this.event]);
        this.trigger('after-update', [this.event]);
    }

    /**
     * Starts the rendering loop.
     */
    runRender () {
        if (this.enabledRender) return;
        this.enabledRender = true;
        this.renderTime = performance.now() / 1000 - this.renderDelta;
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

        this.trigger('before-render', [this.renderEvent]);
        this.trigger('render', [this.renderEvent]);
        this.trigger('after-render', [this.renderEvent]);
    }
}