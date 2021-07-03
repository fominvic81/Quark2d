import { Engine } from '../../engine/Engine';
import { Contact } from '../pair/Contact';
import { Pair } from '../pair/Pair';
import { AABBTree, AABBTreeOptions } from './broadphase/AABBTree/AABBTree';
import { Broadphase, BroadphaseOptions } from './broadphase/Broadphase';
import { GridBroadphase, GridBroadphaseOptions } from './broadphase/Grid';
import { Midphase } from './Midphase';
import { Narrowphase } from './narrowphase/Narrowphase';

export interface ManagerOptions {
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

        this.broadphase = new (options.broadphaseConstructor ?? AABBTree)(this, options.broadphaseOptions);
        this.midphase = new Midphase(this);
        this.narrowphase = new Narrowphase(this);
    }

    update () {
        this.startedPairs.length = 0;
        this.activePairs.length = 0;
        this.endedPairs.length = 0;

        this.pairsToSolve.length = 0;
        this.contactsToSolve.length = 0;

        /* develblock:start */
        this.engine.timer.timeStart('Manager');
        this.engine.timer.timeStart('Broadphase');
        /* develblock:end */

        this.broadphase.update();

        /* develblock:start */
        this.engine.timer.timeEnd('Broadphase');
        this.engine.timer.timeStart('Midphase');
        /* develblock:end */

        this.midphase.update(this.broadphase.activePairs);

        /* develblock:start */
        this.engine.timer.timeEnd('Midphase');
        this.engine.timer.timeStart('Narrowphase');
        /* develblock:end */

        this.narrowphase.update(this.midphase.activePairs);

        /* develblock:start */
        this.engine.timer.timeEnd('Narrowphase');
        this.engine.timer.timeEnd('Manager');
        /* develblock:end */
    }

    getPairsCount () {
        return this.activePairs.length;
    }
}