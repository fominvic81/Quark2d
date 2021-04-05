import { Engine } from '../../engine/Engine';
import { Contact } from '../pair/Contact';
import { Pair } from '../pair/Pair';
import { Broadphase } from './Broadphase';
import { Midphase } from './Midphase';
import { Narrowphase } from './narrowphase/Narrowphase';

interface ManagerOptions {
    broadphase?: Broadphase;
    midphase?: Midphase;
    narrowphase?: Narrowphase;
}

export class Manager {
    engine: Engine;

    broadphase: Broadphase;
    midphase: Midphase;
    narrowphase: Narrowphase;

    pairs: Map<number, Pair> = new Map();

    startedPairs: Array<Pair> = [];
    activePairs: Array<Pair> = [];
    endedPairs: Array<Pair> = [];
    
    pairsToSolve: Array<Pair> = [];

    contacts: Array<Contact> = [];

    constructor (engine: Engine, options: ManagerOptions = {}) {
        this.engine = engine;

        this.broadphase = options.broadphase || new Broadphase(this);
        this.midphase = options.midphase || new Midphase(this);
        this.narrowphase = options.narrowphase || new Narrowphase(this);
    }

    update () {
        this.startedPairs.length = 0;
        this.activePairs.length = 0;
        this.endedPairs.length = 0;

        this.pairsToSolve.length = 0;
        this.contacts.length = 0;

        this.broadphase.update();
        this.midphase.update(this.broadphase.activePairs);
        this.narrowphase.update(this.midphase.activePairs);
    }
}