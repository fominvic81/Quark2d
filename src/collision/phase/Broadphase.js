import { Pair } from '../pair/Pair';
import { ShapePair } from '../pair/ShapePair';
import { Common } from '../../common/Common';
import { Grid } from '../../common/Grid';
import { Vector } from '../../math/Vector';
import { Bounds } from '../../math/Bounds';

export class Broadphase {

    constructor (manager) {
        this.manager = manager;
        this.engine = manager.engine;

        this.grid = new Grid();
        this.gridSize = 1;
        this.activePairs = new Set();
    }

    update () {
        const bodies = this.engine.world.bodies.values();

        for (const body of bodies) {
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
    }

    createRegion (bounds, output) {
        bounds.min.divide(this.gridSize, output.min);
        bounds.max.divide(this.gridSize, output.max);

        output.min.x = Math.floor(output.min.x);
        output.min.y = Math.floor(output.min.y);
        output.max.x = Math.floor(output.max.x);
        output.max.y = Math.floor(output.max.y);

        output.id = this.regionId(output);
        
        return output;
    }

    regionId (region) {
        return (region.min.x << 30) + (region.min.y << 20) + (region.max.x << 10) + region.max.y;
    }

    combineRegions (regionA, regionB, output) {

        output.min.set(Math.min(regionA.min.x, regionB.min.x), Math.min(regionA.min.y, regionB.min.y));
        output.max.set(Math.max(regionA.max.x, regionB.max.x), Math.max(regionA.max.y, regionB.max.y));
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

        const pairId = Common.combineId(bodyA.id, bodyB.id);
        const c = this.manager.pairs.get(pairId);
        
        const pair = c || new Pair(bodyA, bodyB);
        if (!c) {
            this.manager.pairs.set(pairId, pair);
        }

        const shapePairId = Common.combineId(shapeA.id, shapeB.id);
        const s = pair.shapePairs.get(shapePairId);
        const shapePair = s || new ShapePair(shapeA, shapeB, pair);
        shapePair.isActiveBroadphase = true;
        pair.isActiveBroadphase = true;

        this.activePairs.add(pair);

        pair.activeShapePairsBroadphase.add(shapePair)

        if (!s) {
            pair.shapePairs.set(shapePairId, shapePair);
        }
        return shapePair;
    }

    getShapePair (shapeA, shapeB) {
        const bodyA = shapeA.body;
        const bodyB = shapeB.body;

        if ((bodyA === bodyB) || (bodyA.isStatic && bodyB.isStatic)) return;

        const pairId = Common.combineId(bodyA.id, bodyB.id);
        const pair = this.manager.pairs.get(pairId);
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

        const bodyA = shape.body;

        for (const shapeB of cell.values()) {
            const bodyB = shapeB.body;

            const pairId = Common.combineId(bodyA.id, bodyB.id);
            const pair = this.manager.pairs.get(pairId);

            const shapePair = this.getShapePair(shape, shapeB);
            if (shapePair) {
                shapePair.broadphaseCellsCount -= 1;

                if (shapePair.broadphaseCellsCount <= 0) {
                    shapePair.isActiveBroadphase = false;
                    pair.activeShapePairsBroadphase.delete(shapePair);
                    if (pair.activeShapePairsBroadphase.size <= 0) {
                        pair.isActiveBroadphase = false;
                        this.activePairs.delete(pair);
                    }                    
                }
            }
        }

        if (cell.size === 0) {
            this.grid.delete(position);
        }
    }

    updateRegion (region, newRegion, shape) {
        if (!shape.region) {
            for (let x = region.min.x; x <= region.max.x; ++x) {
                for (let y = region.min.y; y <= region.max.y; ++y) {
                    this.addShapeToCell(Vector.temp[2].set(x, y), shape);
                }
            }
            return;
        }
        for (let x = region.min.x; x <= region.max.x; ++x) {
            for (let y = region.min.y; y <= region.max.y; ++y) {

                const position = Vector.temp[2].set(x, y);

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
                const position = Vector.temp[2].set(x, y);
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