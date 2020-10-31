import { Vector } from '../math/Vector';
import { Common } from '../common/Common';

export class Constraint {

    constructor (options = {}) {

        this.id = Common.nextId();
        this.name = 'constraint';
        this.bodyA = options.bodyA;
        this.bodyB = options.bodyB;
        this.pointA = options.pointA ? Vector.clone(options.pointA) : new Vector();
        this.pointB = options.pointB ? Vector.clone(options.pointB) : new Vector();
        this.worldPointA = this.bodyA ? new Vector() : Vector.clone(this.pointA);
        this.worldPointB = this.bodyB ? new Vector() : Vector.clone(this.pointB);
        this.equations = [];

        this.length = options.length;

        if (!this.length) {
            this.getWorldPointA();
            this.getWorldPointB();

            this.length = Vector.length(Vector.subtract(this.worldPointA, this.worldPointB, Vector.temp[0]));
        }

    }

    solve () {
        this.getWorldPointA();
        this.getWorldPointB();

        const fromBtoA = Vector.subtract(this.worldPointA, this.worldPointB, Constraint.vecTemp[0]);
        const dist = Math.max(Vector.length(fromBtoA), 0.001);

        const offsetA = this.bodyA ? Vector.subtract(this.worldPointA, this.bodyA.position, Constraint.vecTemp[1]) : undefined;
        const offsetB = this.bodyB ? Vector.subtract(this.worldPointB, this.bodyB.position, Constraint.vecTemp[2]) : undefined;
        
        const mass = Vector.add(
            this.bodyA ? this.bodyA.inverseMassMultiplied : Vector.zero,
            this.bodyB ? this.bodyB.inverseMassMultiplied : Vector.zero,
            Constraint.vecTemp[3],
        );
        const inertia = (
            (this.bodyA ? this.bodyA.inverseInertiaMultiplied : 0) +
            (this.bodyB ? this.bodyB.inverseInertiaMultiplied : 0) +
            (this.bodyA ? this.bodyA.inverseMass : 0) +
            (this.bodyB ? this.bodyB.inverseMass : 0)
        );

        const args = {
            fromBtoA,
            dist,
            offsetA,
            offsetB,
            mass,
            inertia,
            worldPointA: this.worldPointA,
            worldPointB: this.worldPointB
        };

        for (const equation of this.equations) {
            equation.solve(args);
        }
    }

    addEquation (equations) {
        if (!Array.isArray(equations)) {
            equations = [equations];
        }

        for (const equation of equations) {
            equation.constraint = this;
            this.equations.push(equation);
        }
    }

    getWorldPointA () {
        if (this.bodyA) {
            Vector.rotate(this.pointA, this.bodyA.angle, this.worldPointA);
            Vector.add(this.worldPointA, this.bodyA.position);
        } else {
            Vector.clone(this.pointA, this.worldPointA);
        }
        return this.worldPointA;
    }

    getWorldPointB () {
        if (this.bodyB) {
            Vector.rotate(this.pointB, this.bodyB.angle, this.worldPointB);
            Vector.add(this.worldPointB, this.bodyB.position);
        } else {
            Vector.clone(this.pointB, this.worldPointB);
        }
        return this.worldPointB;
    }

}

Constraint.vecTemp = [
    new Vector(),
    new Vector(),
    new Vector(),
    new Vector(),
    new Vector(),
];