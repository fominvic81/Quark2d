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

export class PointConstraint<UserData = any> extends Constraint {
    stiffness: number;

    constructor (options: PointConstraintOptions = {}, userData?: UserData) {
        super(options, userData);

        this.stiffness = options.stiffness ?? 0.1;
    }

    solve () {

        const pointA = this.getWorldPointA();
        const pointB = this.getWorldPointB();

        const share = 0.5 / ((this.bodyA ? this.bodyA.inverseMass : 0) +
                            (this.bodyB ? this.bodyB.inverseMass : 0));

        const impulse = Vector.subtract(pointA, pointB, Constraint.vecTemp[0]).scale(this.stiffness * share, Constraint.vecTemp[1]);

        if (this.bodyA && this.bodyA.type === BodyType.dynamic) {

            this.bodyA.setSleeping(SleepingState.AWAKE);

            const x = impulse.x * this.bodyA.inverseMass;
            const y = impulse.y * this.bodyA.inverseMass;
            const angle = Vector.cross(this.offsetA, impulse) * this.bodyA.inverseInertia;

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

            this.bodyB.setSleeping(SleepingState.AWAKE);

            const x = impulse.x * this.bodyB.inverseMass;
            const y = impulse.y * this.bodyB.inverseMass;
            const angle = Vector.cross(this.offsetB, impulse) * this.bodyB.inverseInertia;

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