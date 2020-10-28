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

        const impulse = Vector.scale(fromBtoA, this.stiffness * (dist - this.constraint.length) / dist, Vector.temp[3]);

        const relativeVelocity = Vector.temp[4];
        if (this.damping) {
            
            Vector.subtract(
                this.constraint.bodyB ? this.constraint.bodyB.velocity : Vector.zero,
                this.constraint.bodyA ? this.constraint.bodyA.velocity : Vector.zero,
                relativeVelocity,
            );

            const normal = Vector.divide(fromBtoA, dist, Vector.temp[5]);
            const normalVelocity = Vector.dot(relativeVelocity, normal);
            Vector.scale(normal, normalVelocity, relativeVelocity);
        }

        if (this.constraint.bodyA && !this.constraint.bodyA.isStatic) {
            this.constraint.bodyA.setSleeping(Sleeping.AWAKE);
            
            const ratio = (this.constraint.bodyA.inverseMass / mass);

            const impulseX = impulse.x * ratio;
            const impulseY = impulse.y * ratio;
            const impulseAngle = Vector.cross(offsetA, impulse) * (this.constraint.bodyA.inverseInertia / inertia);

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
                const damping = Vector.scale(relativeVelocity, this.damping * ratio, Vector.temp[6]);

                this.constraint.bodyA.velocity.x += damping.x;
                this.constraint.bodyA.velocity.y += damping.y;
            }
        }
        if (this.constraint.bodyB && !this.constraint.bodyB.isStatic) {
            this.constraint.bodyB.setSleeping(Sleeping.AWAKE);

            const ratio = (this.constraint.bodyB.inverseMass / mass);

            const impulseX = impulse.x * ratio;
            const impulseY = impulse.y * ratio;
            const impulseAngle = Vector.cross(offsetB, impulse) * (this.constraint.bodyB.inverseInertia / inertia);

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
                const damping = Vector.scale(relativeVelocity, this.damping * ratio, Vector.temp[6]);

                this.constraint.bodyB.velocity.x -= damping.x;
                this.constraint.bodyB.velocity.y -= damping.y;
            }
        }

    }

}