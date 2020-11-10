import { Vector } from '../../math/Vector';
import { Sleeping } from '../../body/Sleeping';
import { Equation } from './Equation';

// TODO: constrained bodies can sleep

export class DistanceEquation extends Equation {

    constructor (options = {}) {
        super(options);
        this.type = Equation.DISTANCE_EQUATION;

        this.length =
        options.length !== undefined ? options.length :
        options.maxLength;

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
    }

    solve (args) {

        const fromBtoA = args.fromBtoA;
        const dist = args.dist;

        const offsetA = args.offsetA;
        const offsetB = args.offsetB;

        if (this.minLength !== undefined && dist > this.minLength && dist < this.length) return;
        const diff = (this.minLength !== undefined && dist < this.minLength) ? (dist - this.minLength) : (dist - this.length);

        const impulse = Vector.scale(fromBtoA, this.stiffness * diff / dist, Equation.vecTemp[0]);

        const relativeVelocity = Equation.vecTemp[1];
        if (this.damping) {
            
            Vector.subtract(
                this.constraint.bodyB ? this.constraint.bodyB.velocity : Vector.zero,
                this.constraint.bodyA ? this.constraint.bodyA.velocity : Vector.zero,
                relativeVelocity,
            );

            const normal = Vector.divide(fromBtoA, dist, Equation.vecTemp[2]);
            const normalVelocity = Vector.dot(relativeVelocity, normal);
            Vector.scale(normal, normalVelocity, relativeVelocity);
        }

        if (this.constraint.bodyA && !this.constraint.bodyA.isStatic) {
            this.constraint.bodyA.setSleeping(Sleeping.AWAKE);

            const impulseX = impulse.x * args.ratioA.x;
            const impulseY = impulse.y * args.ratioA.y;
            const impulseAngle = Vector.cross(offsetA, impulse) * args.ratioA.inertia;

            this.constraint.bodyA.constraintImpulse.x -= impulseX;
            this.constraint.bodyA.constraintImpulse.y -= impulseY;
            this.constraint.bodyA.constraintImpulse.angle -= impulseAngle;

            this.constraint.bodyA.position.x -= impulseX;
            this.constraint.bodyA.position.y -= impulseY;
            this.constraint.bodyA.angle -= impulseAngle;

            this.constraint.bodyA.velocity.x -= impulseX;
            this.constraint.bodyA.velocity.y -= impulseY;
            this.constraint.bodyA.angularVelocity -= impulseAngle;

            if (this.damping) {
                const damping = Vector.mult(relativeVelocity, Vector.scale(args.ratioB, this.damping, Equation.vecTemp[4]), Equation.vecTemp[4]);

                this.constraint.bodyA.velocity.x += damping.x;
                this.constraint.bodyA.velocity.y += damping.y;
            }
        }
        if (this.constraint.bodyB && !this.constraint.bodyB.isStatic) {
            this.constraint.bodyB.setSleeping(Sleeping.AWAKE);

            const impulseX = impulse.x * args.ratioB.x;
            const impulseY = impulse.y * args.ratioB.y;
            const impulseAngle = Vector.cross(offsetB, impulse) * args.ratioB.inertia;

            this.constraint.bodyB.constraintImpulse.x += impulseX;
            this.constraint.bodyB.constraintImpulse.y += impulseY;
            this.constraint.bodyB.constraintImpulse.angle += impulseAngle;

            this.constraint.bodyB.position.x += impulseX;
            this.constraint.bodyB.position.y += impulseY;
            this.constraint.bodyB.angle += impulseAngle;

            this.constraint.bodyB.velocity.x += impulseX;
            this.constraint.bodyB.velocity.y += impulseY;
            this.constraint.bodyB.angularVelocity += impulseAngle;

            if (this.damping) {
                const damping = Vector.mult(relativeVelocity, Vector.scale(args.ratioB, this.damping, Equation.vecTemp[4]), Equation.vecTemp[4]);

                this.constraint.bodyB.velocity.x -= damping.x;
                this.constraint.bodyB.velocity.y -= damping.y;
            }
        }
    }

    afterAdd () {
        if (this.length === undefined) {
            this.length = Vector.length(Vector.subtract(this.constraint.getWorldPointA(), this.constraint.getWorldPointB(), Equation.vecTemp[0]));
        }
    }
}