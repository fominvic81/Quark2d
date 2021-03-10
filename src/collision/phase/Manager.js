import { Broadphase } from './Broadphase';
import { Midphase } from './Midphase';
import { Narrowphase } from './narrowphase/Narrowphase';


export class Manager {

    constructor (engine, options) {

        this.engine = engine;

        this.broadphase = options.broadphase || new Broadphase(this);
        this.midphase = options.midphase || new Midphase(this);
        this.narrowphase = options.narrowphase || new Narrowphase(this);

        this.pairs = new Map();

        this.startedPairs = [];
        this.activePairs = [];
        this.endedPairs = [];

    }

    update () {
        this.startedPairs.length = 0;
        this.activePairs.length = 0;
        this.endedPairs.length = 0;

        this.broadphase.update();
        this.midphase.update();
        this.narrowphase.update();
    }
}