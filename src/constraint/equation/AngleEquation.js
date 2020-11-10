import { Common } from '../../common/Common';
import { Vector } from '../../math/Vector';
import { Equation } from './Equation';


export class AngleEquation extends Equation {

    constructor (options = {}) {
        super(options);
        this.type = Equation.ANGLE_EQUATION;
        
        this.maxAngleA = options.maxAngleA;

        this.minAngleA =
        options.minAngleA !== undefined ? options.minAngleA : this.maxAngleA;

        if (this.maxAngleA === undefined && this.minAngleA !== undefined) {
            this.maxAngleA = this.minAngleA;
        }

        this.maxAngleB = options.maxAngleB;

        this.minAngleB =
        options.minAngleB !== undefined ? options.minAngleB : this.maxAngleB;

        if (this.maxAngleB === undefined && this.minAngleB !== undefined) {
            this.maxAngleB = this.minAngleB;
        }

        this.stiffnessA = options.stiffnessA;
        this.stiffnessB = options.stiffnessB;

        this.isFixedA = options.isFixedA;
        this.isFixedB = options.isFixedB;

    }
    
    solve (args) {
        
        const fromBtoA = args.fromBtoA;
        const angle = args.angle;

        const offsetA = args.offsetA;
        const offsetB = args.offsetB;

        let impulseA;
        let impulseB;

        if (this.stiffnessA) {
            impulseA = this.solveImpulse(this.constraint.bodyA, angle, this.minAngleA, this.maxAngleA, 1, fromBtoA, Equation.vecTemp[0]);
        }
        if (this.stiffnessB) {
            impulseB = this.solveImpulse(this.constraint.bodyB, angle, this.minAngleB, this.maxAngleB, -1, fromBtoA, Equation.vecTemp[1]);
        }

        if (this.constraint.bodyA && !this.constraint.bodyA.isStatic) {
            if (impulseB && (!this.constraint.bodyB || this.constraint.bodyB.isStatic)) {
                const impulseX = impulseB.x * args.ratioA.x * this.stiffnessB;
                const impulseY = impulseB.y * args.ratioA.y * this.stiffnessB;
                const impulseAngle = Vector.cross(offsetA, impulseB) * args.ratioA.inertia * this.stiffnessB;

                this.constraint.bodyA.constraintImpulse.x -= impulseX;
                this.constraint.bodyA.constraintImpulse.y -= impulseY;
                this.constraint.bodyA.constraintImpulse.angle -= impulseAngle;

                this.constraint.bodyA.position.x -= impulseX;
                this.constraint.bodyA.position.y -= impulseY;
                this.constraint.bodyA.angle -= impulseAngle;

                this.constraint.bodyA.velocity.x -= impulseX;
                this.constraint.bodyA.velocity.y -= impulseY;
                this.constraint.bodyA.angularVelocity -= impulseAngle;

            }
            if (impulseA) {
                const impulseAngle = impulseA.angle * args.ratioA.inertia * this.stiffnessA;

                this.constraint.bodyA.angle -= impulseAngle;
                this.constraint.bodyA.angularVelocity -= impulseAngle;
                this.constraint.bodyA.constraintImpulse.angle -= impulseAngle;
            }
        }

        if (this.constraint.bodyB && !this.constraint.bodyB.isStatic) {
            if (impulseA && (!this.constraint.bodyA || this.constraint.bodyA.isStatic)) {
                const impulseX = impulseA.x * args.ratioB.x * this.stiffnessA;
                const impulseY = impulseA.y * args.ratioB.y * this.stiffnessA;
                const impulseAngle = Vector.cross(offsetB, impulseA) * args.ratioB.inertia * this.stiffnessA;

                this.constraint.bodyB.position.x += impulseX;
                this.constraint.bodyB.position.y += impulseY;
                this.constraint.bodyB.constraintImpulse.angle += impulseAngle;

                this.constraint.bodyB.velocity.x += impulseX;
                this.constraint.bodyB.velocity.y += impulseY;
                this.constraint.bodyB.angle += impulseAngle;

                this.constraint.bodyB.constraintImpulse.x += impulseX;
                this.constraint.bodyB.constraintImpulse.y += impulseY;
                this.constraint.bodyB.angularVelocity += impulseAngle;
            }
            if (impulseB) {
                const impulseAngle = impulseB.angle * args.ratioB.inertia * this.stiffnessB;

                this.constraint.bodyB.angle += impulseAngle;
                this.constraint.bodyB.angularVelocity += impulseAngle;
                this.constraint.bodyB.constraintImpulse.angle += impulseAngle;
            }
        }
    }

    solveImpulse (body, angle, minAngle, maxAngle, scale, fromBtoA, impulse) {
        let angleAbsolute = angle;

        if (body) {
            angleAbsolute = Common.angleDiff(angle, body.angle);
        }

        if (angleAbsolute > minAngle && angleAbsolute < maxAngle) return;

        const clampedAngle = Common.clampAngle(angleAbsolute, minAngle, maxAngle);
        const diff = Common.angleDiff(clampedAngle, angleAbsolute);
        
        Vector.subtract(
            fromBtoA,
            Vector.rotate(fromBtoA, diff, Equation.vecTemp[4]),
            impulse
        );
        impulse.angle = diff * scale;

        return impulse;
    }
}