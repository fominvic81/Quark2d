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

        const ratioA = Constraint.vecTemp[4];
        if (this.bodyA && !this.bodyA.isStatic) {
            ratioA.x = this.bodyA.inverseMassMultiplier.x === 0 ? 0 : this.bodyA.inverseMassMultiplied.x / mass.x;
            ratioA.y = this.bodyA.inverseMassMultiplier.y === 0 ? 0 : this.bodyA.inverseMassMultiplied.y / mass.y;
            ratioA.inertia = this.bodyA.inverseInertiaMultiplier === 0 ? 0 : this.bodyA.inverseInertiaMultiplied / inertia;
        }

        const ratioB = Constraint.vecTemp[5];
        if (this.bodyB && !this.bodyB.isStatic) {
            ratioB.x = this.bodyB.inverseMassMultiplier.x === 0 ? 0 : this.bodyB.inverseMassMultiplied.x / mass.x;
            ratioB.y = this.bodyB.inverseMassMultiplier.y === 0 ? 0 : this.bodyB.inverseMassMultiplied.y / mass.y;
            ratioB.inertia = this.bodyB.inverseInertiaMultiplier === 0 ? 0 : this.bodyB.inverseInertiaMultiplied / inertia;
        }

        const angle = Vector.angle(this.worldPointB, this.worldPointA);

        const args = {
            fromBtoA,
            dist,
            offsetA,
            offsetB,
            worldPointA: this.worldPointA,
            worldPointB: this.worldPointB,
            angle,
        };

        for (const equation of this.equations) {
            equation.solve(args);
        }

        if (this.bodyA && !this.bodyA.isStatic) {
            this.bodyA.setSleeping(Sleeping.AWAKE);

            const impulseX = this.impulseA.x * ratioA.x;
            const impulseY = this.impulseA.y * ratioA.y;
            const impulseAngle = this.impulseA.angle * ratioA.inertia;

            this.bodyA.constraintImpulse.x -= impulseX;
            this.bodyA.constraintImpulse.y -= impulseY;
            this.bodyA.constraintImpulse.angle -= impulseAngle;

            this.bodyA.translate(Vector.set(Vector.temp[0], -impulseX, -impulseY));
            this.bodyA.rotate(-impulseAngle);

            this.bodyA.velocity.x -= impulseX;
            this.bodyA.velocity.y -= impulseY;
            this.bodyA.angularVelocity -= impulseAngle;
        }

        if (this.bodyB && !this.bodyB.isStatic) {
            this.bodyB.setSleeping(Sleeping.AWAKE);

            const impulseX = this.impulseB.x * ratioB.x;
            const impulseY = this.impulseB.y * ratioB.y;
            const impulseAngle = this.impulseB.angle * ratioB.inertia;
            
            this.bodyB.constraintImpulse.x += impulseX;
            this.bodyB.constraintImpulse.y += impulseY;
            this.bodyB.constraintImpulse.angle += impulseAngle;

            this.bodyB.translate(Vector.set(Vector.temp[0], impulseX, impulseY));
            this.bodyB.rotate(impulseAngle);

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
            this.worldPointA.x = this.pointA.x * this.bodyA.dir.x - this.pointA.y * this.bodyA.dir.y;
            this.worldPointA.y = this.pointA.x * this.bodyA.dir.y + this.pointA.y * this.bodyA.dir.x;
            Vector.add(this.worldPointA, this.bodyA.position);
        } else {
            Vector.clone(this.pointA, this.worldPointA);
        }
        return this.worldPointA;
    }

    getWorldPointB () {
        if (this.bodyB) {
            this.worldPointB.x = this.pointB.x * this.bodyB.dir.x - this.pointB.y * this.bodyB.dir.y;
            this.worldPointB.y = this.pointB.x * this.bodyB.dir.y + this.pointB.y * this.bodyB.dir.x;
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
    new Vector(),
];