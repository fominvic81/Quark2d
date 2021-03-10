import { Vector } from '../math/Vector';
import { Common } from '../common/Common';
import { Sleeping } from '../body/Sleeping';

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

        this.impulseA = new Vector();
        this.impulseA.angle = 0;
        this.impulseB = new Vector();
        this.impulseB.angle = 0;
    }

    solve () {

        Vector.set(this.impulseA, 0, 0);
        this.impulseA.angle = 0;
        Vector.set(this.impulseB, 0, 0);
        this.impulseB.angle = 0;

        this.getWorldPointA();
        this.getWorldPointB();

        const fromBtoA = Vector.subtract(this.worldPointA, this.worldPointB, Constraint.vecTemp[0]);
        const dist = Math.max(Vector.length(fromBtoA), 0.001);

        const offsetA = this.bodyA ? Vector.subtract(this.worldPointA, this.bodyA.position, Constraint.vecTemp[1]) : undefined;
        const offsetB = this.bodyB ? Vector.subtract(this.worldPointB, this.bodyB.position, Constraint.vecTemp[2]) : undefined;
        
        const mass = (this.bodyA ? this.bodyA.inverseMass : 0) +
                     (this.bodyB ? this.bodyB.inverseMass : 0);

        const inertia = (
            (this.bodyA ? this.bodyA.inverseInertia : 0) +
            (this.bodyB ? this.bodyB.inverseInertia : 0) +
            mass
        );

        let ratioA, ratioB, inertiaRatioA, inertiaRatioB;
        if (this.bodyA && !this.bodyA.isStatic) {
            ratioA = this.bodyA.inverseMass / mass;
            inertiaRatioA = this.bodyA.inertia === 0 ? 0 : (this.bodyA.inverseInertia / inertia);
        }

        if (this.bodyB && !this.bodyB.isStatic) {
            ratioB = this.bodyB.inverseMass / mass;
            inertiaRatioB = this.bodyB.inertia === 0 ? 0 : (this.bodyB.inverseInertia / inertia);
        }

        const angle = Vector.angle(this.worldPointB, this.worldPointA);

        const args = {
            fromBtoA,
            dist,
            offsetA,
            offsetB,
            worldPointA: this.worldPointA,
            worldPointB: this.worldPointB,
            ratioA,
            ratioB,
            inertiaRatioA,
            inertiaRatioB,
            angle,
        };

        for (const equation of this.equations) {
            equation.solve(args);
        }

        if (this.bodyA && !this.bodyA.isStatic) {
            this.bodyA.setSleeping(Sleeping.AWAKE);

            const impulseX = this.impulseA.x * ratioA;
            const impulseY = this.impulseA.y * ratioA;
            const impulseAngle = this.impulseA.angle * inertiaRatioA;

            this.bodyA.constraintImpulse.x -= impulseX;
            this.bodyA.constraintImpulse.y -= impulseY;
            this.bodyA.constraintImpulse.angle -= impulseAngle;

            this.bodyA.translate(Vector.set(Vector.temp[0], -impulseX, -impulseY));
            this.bodyA.constraintAngle -= impulseAngle;
            Vector.rotate(this.bodyA.constraintDir, -impulseAngle);

            this.bodyA.velocity.x -= impulseX;
            this.bodyA.velocity.y -= impulseY;
            this.bodyA.angularVelocity -= impulseAngle;
        }

        if (this.bodyB && !this.bodyB.isStatic) {
            this.bodyB.setSleeping(Sleeping.AWAKE);

            const impulseX = this.impulseB.x * ratioB;
            const impulseY = this.impulseB.y * ratioB;
            const impulseAngle = this.impulseB.angle * inertiaRatioB;
            
            this.bodyB.constraintImpulse.x += impulseX;
            this.bodyB.constraintImpulse.y += impulseY;
            this.bodyB.constraintImpulse.angle += impulseAngle;

            this.bodyB.translate(Vector.set(Vector.temp[0], impulseX, impulseY));
            this.bodyB.constraintAngle += impulseAngle;
            Vector.rotate(this.bodyB.constraintDir, impulseAngle);

            this.bodyB.velocity.x += impulseX;
            this.bodyB.velocity.y += impulseY;
            this.bodyB.angularVelocity += impulseAngle;
        }

    }

    addEquation (equations) {
        if (!Array.isArray(equations)) {
            equations = [equations];
        }

        for (const equation of equations) {
            equation.constraint = this;
            this.equations.push(equation);
            if (equation.afterAdd) equation.afterAdd();
        }
    }

    getWorldPointA () {
        if (this.bodyA) {
            this.worldPointA.x = this.pointA.x * this.bodyA.constraintDir.x - this.pointA.y * this.bodyA.constraintDir.y;
            this.worldPointA.y = this.pointA.x * this.bodyA.constraintDir.y + this.pointA.y * this.bodyA.constraintDir.x;
            Vector.add(this.worldPointA, this.bodyA.position);
        } else {
            Vector.clone(this.pointA, this.worldPointA);
        }
        return this.worldPointA;
    }

    getWorldPointB () {
        if (this.bodyB) {
            this.worldPointB.x = this.pointB.x * this.bodyB.constraintDir.x - this.pointB.y * this.bodyB.constraintDir.y;
            this.worldPointB.y = this.pointB.x * this.bodyB.constraintDir.y + this.pointB.y * this.bodyB.constraintDir.x;
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
];