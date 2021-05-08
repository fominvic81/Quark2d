import { Shape } from '../../body/shapes/Shape';
import { Common } from '../../common/Common';
import { Engine } from '../../engine/Engine';


export class BuoyancyPair {
    id: number;
    shapeA: Shape;
    shapeB: Shape;
    solve: {(engine: Engine, pair: BuoyancyPair): void};

    constructor (shapeA: Shape, shapeB: Shape, solve: {(engine: Engine, pair: BuoyancyPair): void}) {
        this.id = Common.combineId(shapeA.id, shapeB.id);
        this.shapeA = shapeA;
        this.shapeB = shapeB;
        this.solve = solve;
    }
}