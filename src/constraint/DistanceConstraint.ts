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

export class DistanceConstraint<UserData = any> extends Constraint {
    type: number = ConstraintType.DISTANCE_CONSTRAINT;
    stiffness: number;
    damping: number;
    length: number;
    minLength: number | undefined;
    curLength: number;
    normal: Vector = new Vector();

    constructor (options: DistanceConstraintOptions = {}, userData?: UserData) {
        super(options, userData);
        this.stiffness = options.stiffness ?? 0.1;
        this.damping = options.damping ?? 0;

        this.curLength = Vector.dist(this.getWorldPointA(), this.getWorldPointB());
        this.length = options.length ?? this.curLength;

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
        this.curLength = delta.length();
        const dist = Math.max(this.curLength, 0.001);

        if (this.minLength !== undefined && dist > this.minLength && dist < this.length) return;
        const diff = (this.minLength !== undefined && dist < this.minLength) ? (dist - this.minLength) : (dist - this.length);

        const normal = delta.divide(dist, this.normal);

        const normalCrossA = Vector.cross(this.offsetA, normal);
        const normalCrossB = Vector.cross(this.offsetB, normal);
        const share = 0.5 / (
            (this.bodyA ? (this.bodyA.inverseMass + this.bodyA.inverseInertia * normalCrossA * normalCrossA) : 0) +
            (this.bodyB ? (this.bodyB.inverseMass + this.bodyB.inverseInertia * normalCrossB * normalCrossB) : 0)
        );

        const impulse = normal.scale(this.stiffness * diff * share, Constraint.vecTemp[1]);
        
        const mass = 1 / ((this.bodyA ? this.bodyA.inverseMass : 0) + (this.bodyB ? this.bodyB.inverseMass : 0));
        const dampingImpulse = Constraint.vecTemp[2];

        if (this.damping) {
            Vector.subtract(
                this.bodyB ? this.bodyB.velocity : Vector.zero,
                this.bodyA ? this.bodyA.velocity : Vector.zero,
                dampingImpulse,
            );

            const normalVelocity = Vector.dot(dampingImpulse, normal);
            normal.scale(normalVelocity * mass * this.damping, dampingImpulse);
        }

        if (this.bodyA && this.bodyA.type === BodyType.dynamic) {
            this.bodyA.setSleeping(SleepingState.AWAKE);

            const x = impulse.x * this.bodyA.inverseMass;
            const y = impulse.y * this.bodyA.inverseMass;
            const angle = Vector.cross(this.offsetA, impulse) * this.bodyA.inverseInertia;

            this.bodyA.translate(Vector.temp[0].set(-x, -y));
            angle && this.bodyA.constraintDir.rotate(-angle);
            this.bodyA.constraintAngle -= angle;

            this.bodyA.velocity.x -= x;
            this.bodyA.velocity.y -= y;
            this.bodyA.angularVelocity -= angle;

            this.bodyA.constraintImpulse.x -= x;
            this.bodyA.constraintImpulse.y -= y;
            this.bodyA.constraintAngleImpulse -= angle;

            if (this.damping) {
                const damping = dampingImpulse.scale(this.bodyA.inverseMass, Constraint.vecTemp[3]);

                this.bodyA.velocity.x += damping.x;
                this.bodyA.velocity.y += damping.y;
            }
        }
        if (this.bodyB && this.bodyB.type === BodyType.dynamic) {
            this.bodyB.setSleeping(SleepingState.AWAKE);

            const x = impulse.x * this.bodyB.inverseMass;
            const y = impulse.y * this.bodyB.inverseMass;
            const angle = Vector.cross(this.offsetB, impulse) * this.bodyB.inverseInertia;

            this.bodyB.translate(Vector.temp[0].set(x, y));
            angle && this.bodyB.constraintDir.rotate(angle);
            this.bodyB.constraintAngle += angle;

            this.bodyB.velocity.x += x;
            this.bodyB.velocity.y += y;
            this.bodyB.angularVelocity += angle;

            this.bodyB.constraintImpulse.x += x;
            this.bodyB.constraintImpulse.y += y;
            this.bodyB.constraintAngleImpulse += angle;

            if (this.damping) {
                const damping = dampingImpulse.scale(this.bodyB.inverseMass, Constraint.vecTemp[3]);

                this.bodyB.velocity.x -= damping.x;
                this.bodyB.velocity.y -= damping.y;
            }
        }
    }
}