import { Engine } from '../../engine/Engine';
import { Contact } from '../pair/Contact';
import { Pair } from '../pair/Pair';
import { AABBTree, AABBTreeOptions } from './broadphase/AABBTree/AABBTree';
import { Broadphase, BroadphaseOptions } from './broadphase/Broadphase';
import { GridBroadphase, GridBroadphaseOptions } from './broadphase/Grid';
import { Midphase } from './Midphase';
import { Narrowphase } from './narrowphase/Narrowphase';

interface ManagerOptions {
    broadphaseConstructor?: (typeof GridBroadphase) | (typeof AABBTree);
    broadphaseOptions?: BroadphaseOptions | GridBroadphaseOptions | AABBTreeOptions;
}

export class Manager {
    engine: Engine;

    broadphase: Broadphase;
    midphase: Midphase;
    narrowphase: Narrowphase;

    pairs: Map<number, Pair> = new Map();

    startedPairs: Pair[] = [];
    activePairs: Pair[] = [];
    endedPairs: Pair[] = [];
    
    pairsToSolve: Pair[] = [];
    contactsToSolve: Contact[] = [];

    constructor (engine: Engine, options: ManagerOptions = {}) {
        this.engine = engine;

        this.broadphase = new (options.broadphaseConstructor ?? GridBroadphase)(this, options.broadphaseOptions);
        this.midphase = new Midphase(this);
        this.narrowphase = new Narrowphase(this);
    }

    update () {
        this.startedPairs.length = 0;
        this.activePairs.length = 0;
        this.endedPairs.length = 0;

        this.pairsToSolve.length = 0;
        this.contactsToSolve.length = 0;

        this.broadphase.update();
        this.midphase.update(this.broadphase.activePairs);
        this.narrowphase.update(this.midphase.activePairs);
    }

    getPairsCount () {
        return this.activePairs.length;
    }
}