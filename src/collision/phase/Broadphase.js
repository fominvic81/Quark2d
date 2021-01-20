import { Phase } from './Phase';
import { Pair } from '../pair/Pair';
import { ShapePair } from '../pair/ShapePair';
import { Common } from '../../common/Common';
import { Grid } from '../../common/Grid';
import { Vector } from '../../math/Vector';
import { Bounds } from '../../math/Bounds';
import { Sleeping } from '../../body/Sleeping';

export class Broadphase extends Phase {

    constructor (engine) {
        super(engine);

        this.grid = new Grid();
        this.gridSize = 1;
    }

    update () {
        super.update();


        for (const pair of this.pairs.values()) {
            const isSleeping =
            pair.bodyA.sleepState === Sleeping.SLEEPING &&
            pair.bodyB.sleepState === Sleeping.SLEEPING;

            if (pair.isSleeping && isSleeping) {
                pair.prev.isSleeping = true;
                continue;
            }
            pair.updatePrev();

            pair.isSleeping = isSleeping;

            pair.activeShapePairs.length = 0;

            for (const shapePair of pair.shapePairs.values()) {
                shapePair.updatePrev();
            }
        }

        for (const body of this.engine.world.bodies.values()) {
            for (const shape of body.shapes) {

                const region = this.createRegion(shape.getBounds(), Bounds.temp[0]);

                if (shape.region && shape.region.id === region.id) continue;

                this.updateRegion(region, region, shape);
                if (shape.region) {
                    this.updateRegion(shape.region, region, shape);
                }

                if (!shape.region) {
                    shape.region = this.createRegion(shape.getBounds(), new Bounds());
                }

                region.clone(shape.region);
                shape.region.id = region.id;

            }
        }

        for (const pair of this.pairs.values()) {
            if (!(pair.isSleeping && pair.prev.isSleeping)) {
                pair.isActive = false;
                
                for (const shapePair of pair.shapePairs.values()) {
                    shapePair.isActive = shapePair.isActiveBroadphase;

                    if (shapePair.isActiveBroadphase) {
                        pair.isActive = true;
                    }
                }
            }

            if (pair.isActive) {
                this.activePairsCount += 1;
            }

        }
        
        return this.pairs;
    }

    createRegion (bounds, output) {
        Vector.divide(bounds.min, this.gridSize, output.min),
        Vector.divide(bounds.max, this.gridSize, output.max),

        output.min.x = Math.floor(output.min.x);
        output.min.y = Math.floor(output.min.y);
        output.max.x = Math.floor(output.max.x);
        output.max.y = Math.floor(output.max.y);

        output.id = this.regionId(output);
        
        return output;
    }

    regionId (region) {
        return region.min.x + '|' + region.min.y + '|' + region.max.x + '|' + region.max.y;
    }

    combineRegions (regionA, regionB, output) {

        Vector.set(output.min, Math.min(regionA.min.x, regionB.min.x), Math.min(regionA.min.y, regionB.min.y));
        Vector.set(output.max, Math.max(regionA.max.x, regionB.max.x), Math.max(regionA.max.y, regionB.max.y));
        output.id = this.regionId(output);
        
        return output;
    }

    createShapePair (shapeA_, shapeB_) {
        const comp = shapeA_.body.id > shapeB_.body.id;
        const shapeA = comp ? shapeA_ : shapeB_;
        const shapeB = !comp ? shapeA_ : shapeB_;

        const bodyA = shapeA.body;
        const bodyB = shapeB.body;

        if ((bodyA === bodyB) || (bodyA.isStatic && bodyB.isStatic)) return;
        
        const PairId = Common.combineId(bodyA.id, bodyB.id);
        const c = this.pairs.get(PairId);
        
        const pair = c || new Pair(bodyA, bodyB);
        if (!c) {
            this.pairs.set(PairId, pair);
        }

        if (!(pair.isSleeping && pair.prev.isSleeping)) {
            const shapePairId = Common.combineId(shapeA.id, shapeB.id);
            const s = pair.shapePairs.get(shapePairId);
            const shapePair = s || new ShapePair(shapeA, shapeB);
            shapePair.isActiveBroadphase = true;

            if (!s) {
                pair.shapePairs.set(shapePairId, shapePair);
            }
            return shapePair;
        }
    }

    getShapePair (shapeA, shapeB) {
        const bodyA = shapeA.body;
        const bodyB = shapeB.body;

        if ((bodyA === bodyB) || (bodyA.isStatic && bodyB.isStatic)) return;

        const pairId = Common.combineId(bodyA.id, bodyB.id);
        const pair = this.pairs.get(pairId);
        if (!pair) return;

        const shapePairId = Common.combineId(shapeA.id, shapeB.id);
        return pair.shapePairs.get(shapePairId);
    }

    createCell (position) {
        const cell = new Map();
        this.grid.set(position, cell);
        return cell;
    }

    addShapeToCell (position, shape) {
        const cell = this.grid.get(position);

        if (!cell) {
            this.createCell(position).set(shape.id, shape);
            return;
        }

        for (const shapeB of cell.values()) {
            const shapePair = this.createShapePair(shapeB, shape);
            if (shapePair) {
                shapePair.broadphaseCellsCount += 1;
            }
        }

        cell.set(shape.id, shape);
    }

    removeShapeFromCell (position, shape) {
        const cell = this.grid.get(position);
        if (!cell) return;
        cell.delete(shape.id);

        for (const shapeB of cell.values()) {
            const shapePair = this.getShapePair(shape, shapeB);
            if (shapePair) {
                shapePair.broadphaseCellsCount -= 1;

                if (shapePair.broadphaseCellsCount <= 0) {
                    shapePair.isActiveBroadphase = false;
                }
            }
        }

        if (cell.size === 0) {
            this.grid.delete(position);
        }
    }

    updateRegion (region, newRegion, shape) {
        for (let x = region.min.x; x <= region.max.x; ++x) {
            for (let y = region.min.y; y <= region.max.y; ++y) {

                const position = Vector.set(Vector.temp[2], x, y);

                if (!shape.region) {
                    this.addShapeToCell(position, shape);
                    continue;
                }
                
                const insideOldRegion = shape.region.contains(position);
                const insideNewRegion = newRegion.contains(position);

                if (insideNewRegion && !insideOldRegion) {
                    this.addShapeToCell(position, shape);
                    continue;
                }
                if (!insideNewRegion && insideOldRegion) {
                    this.removeShapeFromCell(position, shape);
                    continue;
                }

            }
        }
    }

    removeShapeFromGrid (shape) {
        if (!shape || !shape.region) return;

        for (let x = shape.region.min.x; x <= shape.region.max.x; ++x) {
            for (let y = shape.region.min.y; y <= shape.region.max.y; ++y) {
                const position = Vector.set(Vector.temp[2], x, y);
                this.removeShapeFromCell(position, shape);
            }
        }
    }

    removeBodyFromGrid (body) {
        for (const shape of body.shapes) {
            this.removeShapeFromGrid(shape);
        }
    }

}