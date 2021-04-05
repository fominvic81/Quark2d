import { Body } from '../../body/Body';
import { Filter } from '../../body/Filter';
import { SleepingState } from '../../body/Sleeping';
import { Engine } from '../../engine/Engine';
import { Pair } from '../pair/Pair';
import { Manager } from './Manager';

export class Midphase {
    manager: Manager;
    engine: Engine;
    activePairs: Pair[] = [];

    constructor (manager: Manager) {
        this.manager = manager;
        this.engine = manager.engine;
    }

    update (pairs: Iterable<Pair>) {
        this.activePairs.length = 0;

        for (const pair of pairs) {
            pair.isActivePrev = pair.isActive;
            if (pair.shapeA.body?.isStatic && pair.shapeB.body?.isStatic) {
                pair.isActive = false;
                continue;
            }
            pair.isSleeping = ((<Body>pair.shapeA.body).sleepState === SleepingState.SLEEPING || (<Body>pair.shapeA.body).isStatic) && ((<Body>pair.shapeB.body).sleepState === SleepingState.SLEEPING || (<Body>pair.shapeB.body).isStatic);
            pair.isActive = false;
            if (!Filter.canCollide(pair.shapeA.filter, pair.shapeB.filter)) continue;

            if (pair.shapeA.aabb.overlaps(pair.shapeB.aabb)) {
                pair.isActive = true;
                this.activePairs.push(pair);
            } else if (pair.isActivePrev) {
                this.manager.endedPairs.push(pair);
            }
        }
    }
}