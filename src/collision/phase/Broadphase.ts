import { Pair } from '../pair/Pair';
import { Common } from '../../common/Common';
import { Grid } from '../../common/Grid';
import { Vector } from '../../math/Vector';
import { AABB } from '../../math/AABB';
import { Shape } from '../../body/shapes/Shape';
import { Body, BodyType } from '../../body/Body';
import { Engine } from '../../engine/Engine';
import { Manager } from './Manager';

type Cell = Map<number, Shape>;

export class Region extends AABB {
    id: number = 0;

    static temp: Region[] = [new Region()];

    constructor () {
        super();
    }

    updateId () {
        this.id = (this.minX << 30) + (this.minY << 20) + (this.maxX << 10) + this.maxY;
    }
}

export class Broadphase {
    manager: Manager;
    engine: Engine;

    grid: Grid<Cell> = new Grid();
    gridSize: number = 1;
    activePairs: Set<Pair> = new Set();

    constructor (manager: Manager) {
        this.manager = manager;
        this.engine = manager.engine;
    }

    update () {
        const bodies = this.engine.world.bodies.values();

        let x, y, tx, ty;
        for (const body of bodies) {
            for (const shape of body.shapes) {

                const region = this.createRegion(shape.aabb, Region.temp[0]);
                const oldRegion = shape.region;

                if (oldRegion.id === region.id) continue;

                const position = Vector.temp[2];
                if (oldRegion.id) {
                    tx = region.maxX;
                    ty = region.maxY;
                    for (x = region.minX; x <= tx; ++x) {
                        for (y = region.minY; y <= ty; ++y) {
                            position.set(x, y);

                            const insideOldRegion = shape.region.contains(position);

                            if (!insideOldRegion) {
                                this.addShapeToCell(position, shape);
                            }
                        }
                    }
                    tx = oldRegion.maxX;
                    ty = oldRegion.maxY;
                    for (x = oldRegion.minX; x <= tx; ++x) {
                        for (y = oldRegion.minY; y <= ty; ++y) {
                            position.set(x, y);
            
                            const insideNewRegion = region.contains(position);
            
                            if (!insideNewRegion) {
                                this.removeShapeFromCell(position, shape);
                            }
                        }
                    }
                } else {
                    tx = region.maxX;
                    ty = region.maxY;
                    for (x = region.minX; x <= tx; ++x) {
                        for (y = region.minY; y <= ty; ++y) {
                            position.set(x, y);
                            this.addShapeToCell(position, shape);
                        }
                    }
                }

                region.clone(shape.region);
                shape.region.id = region.id;
            }
        }
    }

    createRegion (aabb: AABB, output: Region) {
        output.minX = aabb.minX / this.gridSize;
        output.minY = aabb.minY / this.gridSize;
        output.maxX = aabb.maxX / this.gridSize;
        output.maxY = aabb.maxY / this.gridSize;

        output.minX = Math.floor(output.minX);
        output.minY = Math.floor(output.minY);
        output.maxX = Math.floor(output.maxX);
        output.maxY = Math.floor(output.maxY);
        output.updateId();
        
        return output;
    }

    createPair (shapeA_: Shape, shapeB_: Shape) {
        const comp: boolean = (<Body>shapeA_.body).id > (<Body>shapeB_.body).id;
        const shapeA: Shape = comp ? shapeA_ : shapeB_;
        const shapeB: Shape = !comp ? shapeA_ : shapeB_;

        const bodyA: Body = <Body>shapeA.body;
        const bodyB: Body = <Body>shapeB.body;

        if ((bodyA === bodyB) || (bodyA.type !== BodyType.dynamic && bodyB.type !== BodyType.dynamic)) return;

        const pairId: number = Common.combineId(shapeA.id, shapeB.id);
        const s: Pair | undefined = this.manager.pairs.get(pairId);
        const pair: Pair = s || new Pair(shapeA, shapeB);

        this.activePairs.add(pair);

        if (!s) {
            this.manager.pairs.set(pairId, pair);
        }
        return pair;
    }

    getPair (shapeA: Shape, shapeB: Shape) {
        const pairId = Common.combineId(shapeA.id, shapeB.id);
        return this.manager.pairs.get(pairId);
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
            const pair = this.createPair(shapeB, shape);
            if (pair) {
                pair.broadphaseCellsCount += 1;
            }
        }

        cell.set(shape.id, shape);
    }

    removeShapeFromCell (position: Vector, shape: Shape) {
        const cell: Cell | undefined = this.grid.get(position);
        if (!cell) return;
        cell.delete(shape.id);

        for (const shapeB of cell.values()) {
            const pair = this.getPair(shape, shapeB);
            if (pair) {
                pair.broadphaseCellsCount -= 1;

                if (pair.broadphaseCellsCount <= 0) {
                    this.activePairs.delete(pair);
                }
            }
        }

        if (cell.size === 0) {
            this.grid.delete(position);
        }
    }

    removeShape (shape: Shape) {
        if (!shape || !shape.region) return;

        for (let x = shape.region.minX; x <= shape.region.maxX; ++x) {
            for (let y = shape.region.minY; y <= shape.region.maxY; ++y) {
                const position = Vector.temp[2].set(x, y);
                this.removeShapeFromCell(position, shape);
            }
        }
    }

    removeBody (body: Body) {
        for (const shape of body.shapes) {
            this.removeShape(shape);
        }
    }

    *pointTest (point: Vector) {
        const position = Vector.temp[0].set(Math.floor(point.x / this.gridSize), Math.floor(point.y / this.gridSize));
        const shapes = this.grid.get(position);
        if (shapes) for (const shape of shapes?.values()) {
            yield shape;
        }
    }
}