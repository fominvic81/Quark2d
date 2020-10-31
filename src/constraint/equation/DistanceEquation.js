import { Vector } from '../../math/Vector';
import { Sleeping } from '../../body/Sleeping';
import { Equation } from './Equation';

// TODO: constrained bodies can sleep

export class DistanceEquation extends Equation {

    constructor (options = {}) {
        super(options);
        this.type = Equation.DISTANCE_EQUATION;
    }

    solve (args) {

        const fromBtoA = args.fromBtoA;
        const dist = args.dist;

        const offsetA = args.offsetA;
        const offsetB = args.offsetB;
        
        const mass = args.mass;
        const inertia = args.inertia;

        const impulse = Vector.scale(fromBtoA, this.stiffness * (dist - this.constraint.length) / dist, Equation.vecTemp[0]);

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
            
            const ratio = Equation.vecTemp[3];
            ratio.x = this.constraint.bodyA.inverseMassMultiplier.x === 0 ? 0 : this.constraint.bodyA.inverseMassMultiplied.x / mass.x;
            ratio.y = this.constraint.bodyA.inverseMassMultiplier.y === 0 ? 0 : this.constraint.bodyA.inverseMassMultiplied.y / mass.y;
            ratio.inertia = this.constraint.bodyA.inverseInertiaMultiplier === 0 ? 0 : this.constraint.bodyA.inverseInertiaMultiplied / inertia;

            const impulseX = impulse.x * ratio.x;
            const impulseY = impulse.y * ratio.y;
            const impulseAngle = Vector.cross(offsetA, impulse) * ratio.inertia;

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
                const damping = Vector.mult(relativeVelocity, Vector.scale(ratio, this.damping, Equation.vecTemp[4]), Equation.vecTemp[4]);

                this.constraint.bodyA.velocity.x += damping.x;
                this.constraint.bodyA.velocity.y += damping.y;
            }
        }
        if (this.constraint.bodyB && !this.constraint.bodyB.isStatic) {
            this.constraint.bodyB.setSleeping(Sleeping.AWAKE);

            const ratio = Equation.vecTemp[3];
            ratio.x = this.constraint.bodyB.inverseMassMultiplier.x === 0 ? 0 : this.constraint.bodyB.inverseMassMultiplied.x / mass.x;
            ratio.y = this.constraint.bodyB.inverseMassMultiplier.y === 0 ? 0 : this.constraint.bodyB.inverseMassMultiplied.y / mass.y;
            ratio.inertia = this.constraint.bodyB.inverseInertiaMultiplier === 0 ? 0 : this.constraint.bodyB.inverseInertiaMultiplied / inertia;

            const impulseX = impulse.x * ratio.x;
            const impulseY = impulse.y * ratio.y;
            const impulseAngle = Vector.cross(offsetB, impulse) * ratio.inertia;

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
                const damping = Vector.mult(relativeVelocity, Vector.scale(ratio, this.damping, Equation.vecTemp[4]), Equation.vecTemp[4]);

                this.constraint.bodyB.velocity.x -= damping.x;
                this.constraint.bodyB.velocity.y -= damping.y;
            }
        }
    }
}