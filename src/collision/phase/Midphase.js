import { Filter } from '../../body/Filter';
import { Sleeping } from '../../body/Sleeping';

export class Midphase {

    constructor (manager) {
        this.manager = manager;
        this.engine = manager.engine;

        this.activePairs = [];
    }

    update () {
        this.activePairs.length = 0;
        const broadphasePairs = this.manager.broadphase.activePairs.values();

        for (const pair of broadphasePairs) {
            pair.isActivePrev = pair.isActive;
            if (pair.bodyA.isStatic && pair.bodyB.isStatic) {
                pair.isActive = false;
                continue;
            }

            pair.isSleeping = pair.bodyA.sleepState === Sleeping.SLEEPING && pair.bodyB.sleepState === Sleeping.SLEEPING;
            if (!pair.isSleeping) {
                pair.isActive = false;

                for (const shapePair of pair.shapePairs.values()) {
                    if (!shapePair.isActiveBroadphase) continue;
                    shapePair.isActive = false;
                    if (!Filter.canCollide(shapePair.shapeA.filter, shapePair.shapeB.filter)) continue;

                    if (shapePair.shapeA.getBounds().overlaps(shapePair.shapeB.getBounds())) {
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