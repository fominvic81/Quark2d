import { Pair } from '../../pair/Pair';
import { Common } from '../../../common/Common';
import { Grid } from '../../../common/Grid';
import { Vector } from '../../../math/Vector';
import { AABB } from '../../../math/AABB';
import { Shape } from '../../../body/shapes/Shape';
import { Body, BodyType } from '../../../body/Body';
import { Broadphase, BroadphaseOptions, BroadphaseType } from './Broadphase';
import { Manager } from '../Manager';

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

export interface GridBroadphaseOptions extends BroadphaseOptions {
    cellSize?: number;
}

export class GridBroadphase extends Broadphase {
    type = BroadphaseType.Grid;
    grid: Grid<Cell> = new Grid();
    cellSize: number;
    activePairs: Set<Pair> = new Set();

    constructor (manager: Manager, options: GridBroadphaseOptions = {}) {
        super(manager, options);

        this.cellSize = options.cellSize ?? 1;
    }

    update () {
        for (const body of this.engine.world.activeBodies.values()) {
            for (const shape of body.shapes) {
                this.updateShape(shape);
            }
        }
        for (const body of this.engine.world.kinematicBodies.values()) {
            for (const shape of body.shapes) {
                this.updateShape(shape);
            }
        }
    }

    updateShape (shape: Shape) {
        let x, y, tx, ty;

        const region = this.createRegion(shape.aabb, Region.temp[0]);
        const oldRegion = shape.region;

        if (oldRegion.id === region.id) return;

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

    createRegion (aabb: AABB, output: Region) {
        output.minX = aabb.minX / this.cellSize;
        output.minY = aabb.minY / this.cellSize;
        output.maxX = aabb.maxX / this.cellSize;
        output.maxY = aabb.maxY / this.cellSize;

        output.minX = Math.floor(output.minX);
        output.minY = Math.floor(output.minY);
        output.maxX = Math.floor(output.maxX);
        output.maxY = Math.floor(output.maxY);
        output.updateId();
        
        return output;
    }

    createPair (shapeA: Shape, shapeB: Shape) {
        const bodyA: Body = shapeA.body!;
        const bodyB: Body = shapeB.body!;

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
                    if (pair.isActive) {
                        this.manager.endedPairs.push(pair);
                    }
                    this.activePairs.delete(pair);
                }
            }
        }

        if (cell.size === 0) {
            this.grid.delete(position);
        }
    }

    addShape (shape: Shape) {
        this.updateShape(shape);
    }

    addBody (body: Body) {
        for (const shape of body.shapes) this.updateShape(shape);
    }

    removeShape (shape: Shape) {
        if (!shape.region) return;

        for (let x = shape.region.minX; x <= shape.region.maxX; ++x) {
            for (let y = shape.region.minY; y <= shape.region.maxY; ++y) {
                const position = Vector.temp[2].set(x, y);
                this.removeShapeFromCell(position, shape);
            }
        }
    }

    removeBody (body: Body) {
        for (const shape of body.shapes) this.removeShape(shape);
    }

    *pointTest (point: Vector) {
        const position = Vector.temp[0].set(Math.floor(point.x / this.cellSize), Math.floor(point.y / this.cellSize));
        const shapes = this.grid.get(position);
        if (shapes) for (const shape of shapes?.values()) {
            yield shape;
        }
    }

    *aabbTest (aabb: AABB) {
        const region = this.createRegion(aabb, Region.temp[0]);
        const shapesSet: Set<Shape> = new Set();

        let y;
        for (let x = region.minX; x <= region.maxX; ++x) {
            for (y = region.minY; y <= region.maxY; ++y) {
                const position = Vector.temp[0].set(Math.floor(x / this.cellSize), Math.floor(y / this.cellSize));
                const shapes = this.grid.get(position);
                if (shapes) for (const shape of shapes?.values()) {
                    if (shapesSet.has(shape)) continue;
                    shapesSet.add(shape);
                    yield shape;
                }
            }
        }
    }

    *raycast (start: Vector, delta: Vector) {
        const wasChecked: Set<number> = new Set();
        const position = Vector.temp[0];

        // TODO: Rewrite it.
        const gridSize: number = this.cellSize;
        
        let fromX = (start.x / gridSize);
        let fromY = (start.y / gridSize);
        let deltaX = (delta.x / gridSize);
        let deltaY = (delta.y / gridSize);

        let signX;
        let signY;
        let absX;
        let absY;

        let x: number;
        let y: number;
        let x1: number;
        let y1: number;
        let x2: number;
        let y2: number;

        if (deltaX > 0) {
            signX = 1;
            absX = deltaX;

            x = Math.floor(fromX);

            x1 = Math.ceil(fromX);
        } else {
            signX = -1;
            absX = -deltaX;

            x = Math.floor(fromX);

            if (deltaY > 0) {
                fromX -= 1;
            }

            x1 = Math.floor(fromX);
        }

        if (deltaY > 0) {
            signY = 1;
            absY = deltaY;

            y = Math.floor(fromY);

            y2 = Math.ceil(fromY);
        } else {
            signY = -1;
            absY = -deltaY;

            y = Math.floor(fromY);

            if (deltaX > 0) {
                fromY -= 1;
            }

            y2 = Math.floor(fromY);
        }

        const shapes = this.grid.get(position.set(x, y));
        if (shapes) {
            for (const shape of shapes.values()) {
                if (wasChecked.add(shape.id)) {
                    yield shape;
                }
            }
        }

        const xy = deltaX / absY;
        const yx = deltaY / absX;

        y1 = fromY + yx * Math.abs(fromX - x1);

        if (deltaY < 0) {
            if (deltaX > 0) {
                y1 += 1;
            } else {
                x1 -= 1;
            }
        }

        const dy = yx;

        for (let i = 0; i < absX; ++i) {
            const shapes = this.grid.get(position.set(x1 + i * signX, Math.floor(y1)));
            if (shapes) {
                for (const shape of shapes.values()) {
                    if (wasChecked.add(shape.id)) {
                        yield shape;
                    }
                }
            }
            y1 += dy;
        }

        x2 = fromX + xy * Math.abs(fromY - y2);
        if (deltaX < 0) {
            if (deltaY < 0) {
                y2 -= 1;
            } else {
                x2 += 1;
            }
        }

        const dx = xy;

        for (let i = 0; i < absY; ++i) {
            const shapes = this.grid.get(position.set(Math.floor(x2), y2 + i * signY));
            if (shapes) {
                for (const shape of shapes.values()) {
                    if (wasChecked.add(shape.id)) {
                        yield shape;
                    }
                }
            }
            
            x2 += dx;
        }
        
    }

    getPairsCount () {
        return this.activePairs.size;
    }
}