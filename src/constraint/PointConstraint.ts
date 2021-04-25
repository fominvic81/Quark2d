import { BodyType } from '../body/Body';
import { SleepingState } from '../body/Sleeping';
import { Vector } from '../math/Vector';
import { Constraint, ConstraintOptions, ConstraintType } from './Constraint';

interface PointConstraintOptions extends ConstraintOptions {
    stiffness?: number;
    angle?: number,
}

/**
 * The 'PointConstraint' anchors two points on two bodies.
 */

export class PointConstraint extends Constraint {
    stiffness: number;

    constructor (options: PointConstraintOptions = {}) {
        super(options);

        this.stiffness = options.stiffness ?? 0.1;
    }

    solve () {

        const pointA = this.getWorldPointA();
        const pointB = this.getWorldPointB();

        const mass = (this.bodyA ? this.bodyA.inverseMass : 0) +
                     (this.bodyB ? this.bodyB.inverseMass : 0);

        const inertia = (this.bodyA ? this.bodyA.inverseInertia : 0) +
                        (this.bodyB ? this.bodyB.inverseInertia : 0) +
                        mass;

        const impulse = Vector.subtract(pointA, pointB, Constraint.vecTemp[0]).scale(this.stiffness, Constraint.vecTemp[1]);

        if (this.bodyA && this.bodyA.type === BodyType.dynamic) {

            const radio = this.bodyA.inverseMass / mass;
            const inertiaRatio = this.bodyA.inverseInertia / inertia;

            this.bodyA.setSleeping(SleepingState.AWAKE);

            const x = impulse.x * radio;
            const y = impulse.y * radio;
            const angle = Vector.cross(this.offsetA, impulse) * inertiaRatio;

            this.bodyA.translate(Vector.temp[0].set(-x, -y));
            this.bodyA.constraintDir.rotate(-angle);
            this.bodyA.constraintAngle -= angle;

            this.bodyA.velocity.x -= x;
            this.bodyA.velocity.y -= y;
            this.bodyA.angularVelocity -= angle;

            this.bodyA.constraintImpulse.x -= x;
            this.bodyA.constraintImpulse.y -= y;
            this.bodyA.constraintAngleImpulse -= angle;
        }
        if (this.bodyB && this.bodyB.type === BodyType.dynamic) {

            const radio = this.bodyB.inverseMass / mass;
            const inertiaRatio = this.bodyB.inverseInertia / inertia;

            this.bodyB.setSleeping(SleepingState.AWAKE);

            const x = impulse.x * radio;
            const y = impulse.y * radio;
            const angle = Vector.cross(this.offsetB, impulse) * inertiaRatio;

            this.bodyB.translate(Vector.temp[0].set(x, y));
            this.bodyB.constraintDir.rotate(angle);
            this.bodyB.constraintAngle += angle;

            this.bodyB.velocity.x += x;
            this.bodyB.velocity.y += y;
            this.bodyB.angularVelocity += angle;

            this.bodyB.constraintImpulse.x += x;
            this.bodyB.constraintImpulse.y += y;
            this.bodyB.constraintAngleImpulse += angle;
        }

    }

}