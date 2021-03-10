import { Vector } from '../../math/Vector';


export class Equation {

    constructor (options = {}) {
        this.stiffness = options.stiffness || 0.2;
        this.damping = options.damping || 0;
    }

}

Equation.DISTANCE_EQUATION = 0;
Equation.ANGLE_EQUATION = 1;

Equation.vecTemp = [
    new Vector(),
    new Vector(),
    new Vector(),
];