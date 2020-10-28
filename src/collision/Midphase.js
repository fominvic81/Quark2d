import { Phase } from './Phase';
import { Filter } from '../body/Filter';

export class Midphase extends Phase {

    constructor (engine) {
        super(engine);
    }

    update () {
        super.update();
        const broadphasePairs = this.engine.broadphase.pairs;

        for (const pair of broadphasePairs.values()) {
            if (!pair.isActive) continue;
            
            if (!(pair.isSleeping && pair.prev.isSleeping)) {
                pair.isActive = false;
                
                if (pair.bodyA.getBounds().overlaps(pair.bodyB.getBounds())) {
                    
                    for (const shapePair of pair.shapePairs.values()) {
                        if (!shapePair.isActive) continue;
                        shapePair.isActive = false;
                        if (!Filter.canCollide(shapePair.shapeA.filter, shapePair.shapeB.filter)) continue;

                        if (shapePair.shapeA.getBounds().overlaps(shapePair.shapeB.getBounds())) {
                            shapePair.isActive = true;
                            pair.isActive = true;
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
        }
        return this.pairs;
    }
}