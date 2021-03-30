import { Filter } from '../../body/Filter';
import { SleepingState } from '../../body/Sleeping';
import { Pair } from '../pair/Pair';

export class Midphase {
    manager: any; // TODO-types
    engine: any; // TODO-types
    activePairs: Array<Pair> = [];

    constructor (manager: any) { //TODO-types
        this.manager = manager;
        this.engine = manager.engine;
    }

    update () {
        this.activePairs.length = 0;

        for (const pair of this.manager.broadphase.activePairs.values()) {
            pair.isActivePrev = pair.isActive;
            if (pair.bodyA.isStatic && pair.bodyB.isStatic) {
                pair.isActive = false;
                continue;
            }

            pair.isSleeping = pair.bodyA.sleepState === SleepingState.SLEEPING && pair.bodyB.sleepState === SleepingState.SLEEPING;
            if (!pair.isSleeping) {
                pair.isActive = false;

                for (const shapePair of pair.activeShapePairsBroadphase.values()) {
                    shapePair.isActive = false;
                    if (!Filter.canCollide(shapePair.shapeA.filter, shapePair.shapeB.filter)) continue;

                    if (shapePair.shapeA.bounds.overlaps(shapePair.shapeB.bounds)) {
                        shapePair.isActive = true;
                        pair.isActive = true;
                    }
                }
            }

            if (pair.isActive) {
                this.activePairs.push(pair);
            } else if (pair.isActivePrev) {
                this.manager.endedPairs.push(pair);
            }
        }
    }
}