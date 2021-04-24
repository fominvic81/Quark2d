import { BodyType } from '../body/Body';
import { SleepingState } from '../body/Sleeping';
import { Vector } from '../math/Vector';
import { Constraint, ConstraintOptions, ConstraintType } from './Constraint';

interface DistanceConstraintOptions extends ConstraintOptions {
    stiffness?: number;
    damping?: number;
    length?: number;
    minLength?: number;
}

/**
 * The 'DistanceConstraint' keeps two points on two bodies on a fixed distance.
 * The 'DistanceConstraint' can be soft(use options.stiffness[0...1] and options.damping[0...1]).
 */

export class DistanceConstraint extends Constraint {
    type: number = ConstraintType.DISTANCE_CONSTRAINT;
    stiffness: number;
    damping: number;
    length: number;
    minLength: number | undefined;

    constructor (options: DistanceConstraintOptions = {}) {
        super(options);
        this.stiffness = options.stiffness ?? 0.1;
        this.damping = options.damping ?? 0;

        this.length = options.length ?? Vector.dist(this.getWorldPointA(), this.getWorldPointB());

        if (options.minLength !== undefined) {
            this.minLength = options.minLength;

            if (<number>this.minLength > this.length) {
                [this.minLength, this.length] = [this.length, <number>this.minLength];
            }
        }
    }

    /**
     * Solves a distance constraint.
     */
    solve () {
        const pointA = this.getWorldPointA();
        const pointB = this.getWorldPointB();

        const delta = Vector.subtract(pointA, pointB, Constraint.vecTemp[0]);
        const dist = Math.max(delta.length(), 0.001);

        const mass = (this.bodyA ? this.bodyA.inverseMass : 0) +
                     (this.bodyB ? this.bodyB.inverseMass : 0);

        const inertia = (this.bodyA ? this.bodyA.inverseInertia : 0) +
                        (this.bodyB ? this.bodyB.inverseInertia : 0) +
                        mass;

        if (this.minLength !== undefined && dist > this.minLength && dist < this.length) return;
        const diff = (this.minLength !== undefined && dist < this.minLength) ? (dist - this.minLength) : (dist - this.length);

        const impulse = delta.scale(this.stiffness * diff / dist, Constraint.vecTemp[1]);

        const relativeVelocity = Constraint.vecTemp[2];
        if (this.damping) {

            Vector.subtract(
                this.bodyB ? this.bodyB.velocity : Vector.zero,
                this.bodyA ? this.bodyA.velocity : Vector.zero,
                relativeVelocity,
            ).scale(this.damping);

            const normal = delta.divide(dist, Constraint.vecTemp[3]);

            const normalVelocity = Vector.dot(relativeVelocity, normal);
            normal.scale(normalVelocity, relativeVelocity);
        }

        if (this.bodyA && this.bodyA.type === BodyType.dynamic) {
            this.bodyA.setSleeping(SleepingState.AWAKE);

            const offset = Vector.subtract(pointA, this.bodyA.position, Constraint.vecTemp[4]);

            const ratio = this.bodyA.inverseMass / mass;
            const inertiaratio = this.bodyA.inverseInertia / inertia;

            const x = impulse.x * <number>ratio;
            const y = impulse.y * <number>ratio;
            const angle = Vector.cross(<Vector>offset, impulse) * <number>inertiaratio;

            this.bodyA.translate(Vector.temp[0].set(-x, -y));
            this.bodyA.constraintDir.rotate(-angle);
            this.bodyA.constraintAngle -= angle;

            this.bodyA.velocity.x -= x;
            this.bodyA.velocity.y -= y;
            this.bodyA.angularVelocity -= angle;

            this.bodyA.constraintImpulse.x -= x;
            this.bodyA.constraintImpulse.y -= y;
            this.bodyA.constraintAngleImpulse -= angle;

            if (this.damping) {
                const damping = relativeVelocity.scale(<number>ratio, Constraint.vecTemp[5]);

                this.bodyA.velocity.x += damping.x;
                this.bodyA.velocity.y += damping.y;
            }
        }
        if (this.bodyB && this.bodyB.type === BodyType.dynamic) {
            this.bodyB.setSleeping(SleepingState.AWAKE);

            const offset = Vector.subtract(pointB, this.bodyB.position, Constraint.vecTemp[4]);

            const ratio = this.bodyB.inverseMass / mass;
            const inertiaratio = this.bodyB.inverseInertia / inertia;

            const x = impulse.x * <number>ratio;
            const y = impulse.y * <number>ratio;
            const angle = Vector.cross(<Vector>offset, impulse) * <number>inertiaratio;

            this.bodyB.translate(Vector.temp[0].set(x, y));
            this.bodyB.constraintDir.rotate(angle);
            this.bodyB.constraintAngle += angle;

            this.bodyB.velocity.x += x;
            this.bodyB.velocity.y += y;
            this.bodyB.angularVelocity += angle;

            this.bodyB.constraintImpulse.x += x;
            this.bodyB.constraintImpulse.y += y;
            this.bodyB.constraintAngleImpulse += angle;

            if (this.damping) {
                const damping = relativeVelocity.scale(<number>ratio, Constraint.vecTemp[5]);

                this.bodyB.velocity.x -= damping.x;
                this.bodyB.velocity.y -= damping.y;
            }
        }
    }
}