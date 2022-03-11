import { Engine } from '../../engine/Engine';
import { Contact } from '../pair/Contact';
import { Pair } from '../pair/Pair';
import { Broadphase, BroadphaseOptions } from './broadphase/Broadphase';
import { Midphase } from './Midphase';
import { Narrowphase } from './narrowphase/Narrowphase';

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

    constructor (engine: Engine, options: BroadphaseOptions = {}) {
        this.engine = engine;

        this.broadphase = new Broadphase(this, options);
        this.midphase = new Midphase(this);
        this.narrowphase = new Narrowphase(this);
    }

    beforeUpdate (dt: number) {
        this.startedPairs.length = 0;
        this.activePairs.length = 0;
        this.endedPairs.length = 0;

        this.pairsToSolve.length = 0;
        this.contactsToSolve.length = 0;

        /* develblock:start */
        this.engine.timer.timeStart('Broadphase');
        /* develblock:end */

        this.broadphase.update(dt);

        /* develblock:start */
        this.engine.timer.timeEnd('Broadphase');
        /* develblock:end */

    }

    update () {        

        /* develblock:start */
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
        /* develblock:end */

        for (const pair of this.startedPairs) {
            pair.shapeA.body!.pairs.set(pair.id, pair);
            pair.shapeB.body!.pairs.set(pair.id, pair);
        }
        for (const pair of this.endedPairs) {
            pair.shapeA.body!.pairs.delete(pair.id);
            pair.shapeB.body!.pairs.delete(pair.id);
        }
    }

    getPairsCount () {
        return this.activePairs.length;
    }
}