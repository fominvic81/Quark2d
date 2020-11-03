import { Events } from '../../common/Events';


export class Runner {

    constructor (options = {}) {

        this.setTps(options.tps || 60);
        this.tps = 0;
        this.delta = 0;
        this.deltaAccumulator = 0;
        this.time = performance.now() / 1000;
        this.events = new Events();
        this.event = {
            time: 0,
            delta: 0,
            tps: 0,
        }
        this.renderEvent = {
            time: 0,
            delta: 0,
            fps: 0,
        }
        this.enabled = false;
        
        this.renderTime = performance.now() / 1000;
        this.enabledRender = false;
    }

    run () {
        if (this.enabled) return;
        this.enabled = true;
        this.tick();
    }

    stop () {
        this.enabled = false;
    }

    tick () {
        if (!this.enabled) return;

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
        
        setTimeout(() => {this.tick()}, 0);
    }

    setTps (tps) {
        this.fixedTps = tps;
        this.fixedDelta = 1 / tps;
    }

    runRender () {
        if (this.enabledRender) return;
        this.enabledRender = true;
        this.render();
    }

    stopRender () {
        this.enabledRender = false;
    }

    render () {
        if (!this.enabledRender) return;

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

        window.requestAnimationFrame(() => {this.render()});
    }

}