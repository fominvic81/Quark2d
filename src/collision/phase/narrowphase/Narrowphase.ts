import { Colliders } from './Colliders';

export class Narrowphase {
    manager: any; // TODO-types
    engine: any; // TODO-types

    constructor (manager: any) { //TODO-types
        this.manager = manager;
        this.engine = manager.engine;
    }

    update () {

        const midphasePairs = this.manager.midphase.activePairs.values();

        for (const pair of midphasePairs) {
            if (!pair.isActive) {
                if (pair.isActivePrev) {
                    this.manager.endedPairs.push(pair);
                }
                continue;
            };
            pair.activeShapePairs.length = 0;

            if (!pair.isSleeping) {
                pair.isActive = false;
                pair.contactsCount = 0;

                for (const shapePair of pair.shapePairs.values()) {
                    if (!shapePair.isActive) continue;
                    shapePair.isActive = false;

                    Colliders[shapePair.shapeA.type | shapePair.shapeB.type](shapePair);

                    if (shapePair.isActive) {
                        pair.isActive = true;
                        pair.activeShapePairs.push(shapePair);
                        pair.contactsCount += shapePair.contactsCount;
                    }
                }
            }

            if (pair.isActive) {
                this.manager.activePairs.push(pair);
                if (!pair.isActivePrev) {
                    this.manager.startedPairs.push(pair);
                }
            } else if (pair.isActivePrev) {
                this.manager.endedPairs.push(pair);
            } 
        }
    }
}