import { Pair } from '../pair/Pair';
import { ShapePair } from '../pair/ShapePair';
import { Common } from '../../common/Common';
import { Grid } from '../../common/Grid';
import { Vector } from '../../math/Vector';
import { AABB } from '../../math/AABB';
import { Shape } from '../../body/shapes/Shape';
import { Body } from '../../body/Body';
import { Engine } from '../../engine/Engine';
import { Manager } from './Manager';

type Cell = Map<number, Shape>;

export class Region extends AABB {
    id: number = 0;

    static temp: Array<Region> = [new Region()];

    constructor () {
        super();
    }

    updateId () {
        this.id = (this.min.x << 30) + (this.min.y << 20) + (this.max.x << 10) + this.max.y;
    }
}

export class Broadphase {
    manager: Manager;
    engine: Engine;

    grid: Grid = new Grid();
    gridSize: number = 1;
    activePairs: Set<Pair> = new Set();

    constructor (manager: Manager) {
        this.manager = manager;
        this.engine = manager.engine;
    }

    update () {
        const bodies = this.engine.world.bodies.values();

        for (const body of bodies) {
            for (const shape of body.shapes) {

                const region = this.createRegion(shape.aabb, Region.temp[0]);

                if (shape.region && shape.region.id === region.id) continue;

                this.updateRegion(region, region, shape);
                if (shape.region) {
                    this.updateRegion(shape.region, region, shape);
                }

                if (!shape.region) {
                    shape.region = this.createRegion(shape.aabb, new Region());
                }

                region.clone(shape.region);
                shape.region.id = region.id;
            }
        }
    }

    createRegion (aabb: AABB, output: Region) {
        aabb.min.divide(this.gridSize, output.min);
        aabb.max.divide(this.gridSize, output.max);

        output.min.x = Math.floor(output.min.x);
        output.min.y = Math.floor(output.min.y);
        output.max.x = Math.floor(output.max.x);
        output.max.y = Math.floor(output.max.y);
        output.updateId();
        
        return output;
    }

    createShapePair (shapeA_: Shape, shapeB_: Shape) {
        const comp: boolean = (<Body>shapeA_.body).id > (<Body>shapeB_.body).id;
        const shapeA: Shape = comp ? shapeA_ : shapeB_;
        const shapeB: Shape = !comp ? shapeA_ : shapeB_;

        const bodyA: Body = <Body>shapeA.body;
        const bodyB: Body = <Body>shapeB.body;

        if ((bodyA === bodyB) || (bodyA.isStatic && bodyB.isStatic)) return;

        const pairId: number = Common.combineId(bodyA.id, bodyB.id);
        const c: Pair | undefined = this.manager.pairs.get(pairId);

        const pair: Pair = c || new Pair(bodyA, bodyB);
        if (!c) {
            this.manager.pairs.set(pairId, pair);
        }

        const shapePairId: number = Common.combineId(shapeA.id, shapeB.id);
        const s: ShapePair | undefined = pair.shapePairs.get(shapePairId);
        const shapePair: ShapePair = s || new ShapePair(shapeA, shapeB, pair);
        shapePair.isActiveBroadphase = true;
        pair.isActiveBroadphase = true;

        this.activePairs.add(pair);

        pair.activeShapePairsBroadphase.add(shapePair)

        if (!s) {
            pair.shapePairs.set(shapePairId, shapePair);
        }
        return shapePair;
    }

    getShapePair (shapeA: Shape, shapeB: Shape) {
        const bodyA = <Body>shapeA.body;
        const bodyB = <Body>shapeB.body;

        if ((bodyA === bodyB) || (bodyA.isStatic && bodyB.isStatic)) return;

        const pairId = Common.combineId(bodyA.id, bodyB.id);
        const pair = this.manager.pairs.get(pairId);
        if (!pair) return;

        const shapePairId = Common.combineId(shapeA.id, shapeB.id);
        return pair.shapePairs.get(shapePairId);
    }

    createCell (position: Vector) {
        const cell: Cell = new Map();
        this.grid.set(position, cell);
        return cell;
    }

    addShapeToCell (position: Vector, shape: Shape) {
        const cell: Cell | undefined = this.grid.get(position);

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

    removeShapeFromCell (position: Vector, shape: Shape) {
        const cell: Cell | undefined = this.grid.get(position);
        if (!cell) return;
        cell.delete(shape.id);

        const bodyA = shape.body;

        for (const shapeB of cell.values()) {
            const bodyB = shapeB.body;

            const pairId = Common.combineId((<Body>bodyA).id, (<Body>bodyB).id);
            const pair = <Pair>this.manager.pairs.get(pairId);

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

    updateRegion (region: Region, newRegion: Region, shape: Shape) {
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

    removeShapeFromGrid (shape: Shape) {
        if (!shape || !shape.region) return;

        for (let x = shape.region.min.x; x <= shape.region.max.x; ++x) {
            for (let y = shape.region.min.y; y <= shape.region.max.y; ++y) {
                const position = Vector.temp[2].set(x, y);
                this.removeShapeFromCell(position, shape);
            }
        }
    }

    removeBodyFromGrid (body: Body) {
        for (const shape of body.shapes) {
            this.removeShapeFromGrid(shape);
        }
    }
}