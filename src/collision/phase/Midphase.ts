import { BodyType } from '../../body/Body';
import { Filter } from '../../body/Filter';
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
            if (pair.shapeA.body?.type !== BodyType.dynamic && pair.shapeB.body?.type !== BodyType.dynamic) {
                pair.isActive = false;
                continue;
            }
            pair.isSleeping = (pair.shapeA.body!.isSleeping || pair.shapeA.body!.type !== BodyType.dynamic) && (pair.shapeB.body!.isSleeping || (pair.shapeB.body!).type !== BodyType.dynamic);
            if (!pair.isSleeping && !pair.isActivePrev) {
                pair.isActive = false;
                if (!Filter.canCollide(pair.shapeA.filter, pair.shapeB.filter)) continue;

                if (pair.shapeA.aabb.overlaps(pair.shapeB.aabb)) {
                    pair.isActive = true;
                    this.activePairs.push(pair);
                } else if (pair.isActivePrev) {
                    this.manager.endedPairs.push(pair);
                }
            } else if (pair.isActive) {
                this.activePairs.push(pair);
            }
        }
    }

    getPairsCount () {
        return this.activePairs.length;
    }
}