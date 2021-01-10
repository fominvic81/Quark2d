import { Phase } from '../Phase';
import { Colliders } from './Colliders';

export class Narrowphase extends Phase {

    constructor (engine) {
        super(engine);
        this.startedPairs = [];
        this.activePairs = [];
        this.endedPairs = [];
    }

    update () {
        super.update();
        this.startedPairs.length = 0;
        this.activePairs.length = 0;
        this.endedPairs.length = 0;
        
        const midphasePairs = this.engine.midphase.pairs;

        for (const pair of midphasePairs.values()) {
            if (!pair.isActive) {
                if (pair.prev.isActive) {
                    this.endedPairs.push(pair);
                }
                continue;
            };
            
            if (!(pair.isSleeping && pair.prev.isSleeping)) {
                pair.isActive = false;
                pair.reset();

                for (const shapePair of pair.shapePairs.values()) {
                    if (!shapePair.isActive) continue;
                    shapePair.isActive = false;
                    
                    Colliders[shapePair.shapeA.type | shapePair.shapeB.type](shapePair);

                    if (shapePair.isActive) {
                        pair.isActive = true;
                        
                        pair.activeShapePairs.push(shapePair);

                        for (let i = 0; i < shapePair.contactsCount; ++i) {
                            pair.contacts.push(shapePair.contacts[i]);
                        }
                    }
                }
            }

            if (pair.isActive) {
                this.activePairsCount += 1;
                if (!this.pairs.has(pair.id)) {
                    this.pairs.set(pair.id, pair);
                }
            }
            

            if (pair.isActive && !pair.prev.isActive) {
                this.startedPairs.push(pair);
            }
            if (!pair.isActive && pair.prev.isActive) {
                this.endedPairs.push(pair);
            } 
            if (pair.isActive) {
                this.activePairs.push(pair);
            }

        }
        return this.pairs;
    }
}

Narrowphase.PREV_COLLISION_MOTION_LIMIT = 0.000005;