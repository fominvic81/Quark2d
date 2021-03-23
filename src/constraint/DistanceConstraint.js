import { Sleeping } from '../body/Sleeping';
import { Vector } from '../math/Vector';
import { Constraint } from './Constraint';

export class DistanceConstraint extends Constraint {

    constructor (options = {}) {
        super(options);
        this.type = Constraint.DISTANCE_CONSTRAINT;
        this.stiffness = options.stiffness === undefined ? 0.1 : options.stiffness;
        this.damping = options.damping === undefined ? 0 : options.damping;

        this.length = options.length !== undefined ? options.length : options.maxLength;

        if (options.minLength !== undefined) {
            if (this.length === undefined) {
                this.length = options.minLength;
            } else {
                this.minLength = options.minLength;

                if (this.minLength > this.length) {
                    [this.minLength, this.length] = [this.length, this.minLength];
                }
            }
        }

        if (this.length === undefined) {
            this.length = Vector.dist(this.getWorldPointA(), this.getWorldPointB());
        }
    }

    solve () {
        const pointA = this.getWorldPointA();
        const pointB = this.getWorldPointB();

        const delta = Vector.subtract(pointA, pointB, Constraint.vecTemp[0]);
        const dist = Math.max(Vector.length(delta), 0.001);

        const mass = (this.bodyA ? this.bodyA.inverseMass : 0) +
                    (this.bodyB ? this.bodyB.inverseMass : 0);

        const inertia = (this.bodyA ? this.bodyA.inverseInertia : 0) +
                        (this.bodyB ? this.bodyB.inverseInertia : 0) +
                        mass;

        let ratioA, ratioB, inertiaRatioA, inertiaRatioB;
        if (this.bodyA && !this.bodyA.isStatic) {
            ratioA = this.bodyA.inverseMass / mass;
            inertiaRatioA = this.bodyA.inverseInertia / inertia;
        }

        if (this.bodyB && !this.bodyB.isStatic) {
            ratioB = this.bodyB.inverseMass / mass;
            inertiaRatioB = this.bodyB.inverseInertia / inertia;
        }

        const offsetA = this.bodyA ? Vector.subtract(pointA, this.bodyA.position, Constraint.vecTemp[1]) : undefined;
        const offsetB = this.bodyB ? Vector.subtract(pointB, this.bodyB.position, Constraint.vecTemp[2]) : undefined;

        if (this.minLength !== undefined && dist > this.minLength && dist < this.length) return;
        const diff = (this.minLength !== undefined && dist < this.minLength) ? (dist - this.minLength) : (dist - this.length);

        const impulse = Vector.scale(delta, this.stiffness * diff / dist, Constraint.vecTemp[3]);

        const relativeVelocity = Constraint.vecTemp[4];
        if (this.damping) {

            Vector.subtract(
                this.bodyB ? this.bodyB.velocity : Vector.zero,
                this.bodyA ? this.bodyA.velocity : Vector.zero,
                relativeVelocity,
            );

            const normal = Vector.divide(delta, dist, Constraint.vecTemp[5]);

            const normalVelocity = Vector.dot(relativeVelocity, normal);
            Vector.scale(normal, normalVelocity, relativeVelocity);
        }

        if (this.bodyA && !this.bodyA.isStatic) {
            this.bodyA.setSleeping(Sleeping.AWAKE);

            const x = impulse.x * ratioA;
            const y = impulse.y * ratioA;
            const angle = Vector.cross(offsetA, impulse) * inertiaRatioA;

            this.bodyA.translate(Vector.set(Vector.temp[0], -x, -y));
            Vector.rotate(this.bodyA.constraintDir, -angle);
            this.bodyA.constraintAngle -= angle;

            this.bodyA.velocity.x -= x;
            this.bodyA.velocity.y -= y;
            this.bodyA.angularVelocity -= angle;

            this.bodyA.constraintImpulse.x -= x;
            this.bodyA.constraintImpulse.y -= y;
            this.bodyA.constraintImpulse.angle -= angle;

            if (this.damping) {
                const damping = Vector.scale(relativeVelocity, ratioA * this.damping, Constraint.vecTemp[6]);

                this.bodyA.velocity.x += damping.x;
                this.bodyA.velocity.y += damping.y;
            }
        }
        if (this.bodyB && !this.bodyB.isStatic) {
            this.bodyB.setSleeping(Sleeping.AWAKE);

            const x = impulse.x * ratioB;
            const y = impulse.y * ratioB;
            const angle = Vector.cross(offsetB, impulse) * inertiaRatioB;

            this.bodyB.translate(Vector.set(Vector.temp[0], x, y));
            Vector.rotate(this.bodyB.constraintDir, angle);
            this.bodyB.constraintAngle += angle;

            this.bodyB.velocity.x += x;
            this.bodyB.velocity.y += y;
            this.bodyB.angularVelocity += angle;

            this.bodyB.constraintImpulse.x += x;
            this.bodyB.constraintImpulse.y += y;
            this.bodyB.constraintImpulse.angle += angle;

            if (this.damping) {
                const damping = Vector.scale(relativeVelocity, ratioB * this.damping, Constraint.vecTemp[6]);

                this.bodyB.velocity.x -= damping.x;
                this.bodyB.velocity.y -= damping.y;
            }
        }
    }

}