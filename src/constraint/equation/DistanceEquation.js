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

            this.constraint.impulseA.x += impulse.x;
            this.constraint.impulseA.y += impulse.y;
            this.constraint.impulseA.angle += Vector.cross(offsetA, impulse);

            if (this.damping) {
                const damping = Vector.mult(relativeVelocity, Vector.scale(args.ratioA, this.damping, Equation.vecTemp[4]), Equation.vecTemp[4]);

                this.constraint.bodyA.velocity.x += damping.x;
                this.constraint.bodyA.velocity.y += damping.y;
            }
        }
        if (this.constraint.bodyB && !this.constraint.bodyB.isStatic) {
            this.constraint.bodyB.setSleeping(Sleeping.AWAKE);

            this.constraint.impulseB.x += impulse.x;
            this.constraint.impulseB.y += impulse.y;
            this.constraint.impulseB.angle += Vector.cross(offsetB, impulse);

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