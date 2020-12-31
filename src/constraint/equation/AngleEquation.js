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

    }
    
    solve (args) {
        
        const fromBtoA = args.fromBtoA;
        const angle = args.angle;
        const distSquared = Math.pow(args.dist, 2);

        const offsetA = args.offsetA;
        const offsetB = args.offsetB;

        let impulseA;
        let impulseB;

        if (this.stiffnessA) {
            impulseA = this.solveImpulse(this.constraint.bodyA, angle, this.minAngleA, this.maxAngleA, 1, fromBtoA, distSquared, Equation.vecTemp[0]);
        }
        if (this.stiffnessB) {
            impulseB = this.solveImpulse(this.constraint.bodyB, angle, this.minAngleB, this.maxAngleB, -1, fromBtoA, distSquared, Equation.vecTemp[1]);
        }

        if (impulseB) {
            if (this.constraint.bodyA && !this.constraint.bodyA.isStatic) {
                const impulseX = impulseB.x * args.ratioA.x * this.stiffnessB;
                const impulseY = impulseB.y * args.ratioA.y * this.stiffnessB;
                const impulseAngle = Vector.cross(offsetA, impulseB) * args.ratioA.inertia * this.stiffnessB;

                this.constraint.bodyA.translate(Vector.set(Equation.vecTemp[4], -impulseX, -impulseY));
                this.constraint.bodyA.rotate(-impulseAngle);
                
                this.constraint.bodyA.velocity.x -= impulseX;
                this.constraint.bodyA.velocity.y -= impulseY;
                this.constraint.bodyA.angularVelocity -= impulseAngle;
                
                this.constraint.bodyA.constraintImpulse.x -= impulseX;
                this.constraint.bodyA.constraintImpulse.y -= impulseY;
                this.constraint.bodyA.constraintImpulse.angle -= impulseAngle;
            }

            if (this.constraint.bodyB && !this.constraint.bodyB.isStatic) {
                const impulseX = impulseB.x * args.ratioB.x * this.stiffnessB;
                const impulseY = impulseB.y * args.ratioB.y * this.stiffnessB;
                const impulseAngle = Vector.cross(offsetB, impulseB) * args.ratioB.inertia * this.stiffnessB;

                this.constraint.bodyB.translate(Vector.set(Equation.vecTemp[4], impulseX, impulseY));

                this.constraint.bodyB.velocity.x += impulseX;
                this.constraint.bodyB.velocity.y += impulseY;
                this.constraint.bodyB.angle += impulseAngle;

                this.constraint.bodyB.constraintImpulse.x += impulseX;
                this.constraint.bodyB.constraintImpulse.y += impulseY;
                this.constraint.bodyB.angularVelocity += impulseAngle;

                const impulseAngleB = impulseB.angle * args.ratioB.inertia * this.stiffnessB;

                this.constraint.bodyB.rotate(impulseAngle + impulseAngleB);
                this.constraint.bodyB.angularVelocity += impulseAngleB;
                this.constraint.bodyB.constraintImpulse.angle += impulseAngleB;
            }
        }

        if (impulseA) {
            if (this.constraint.bodyB && !this.constraint.bodyB.isStatic) {
                const impulseX = impulseA.x * args.ratioB.x * this.stiffnessA;
                const impulseY = impulseA.y * args.ratioB.y * this.stiffnessA;
                const impulseAngle = Vector.cross(offsetB, impulseA) * args.ratioB.inertia * this.stiffnessA;

                this.constraint.bodyB.translate(Vector.set(Equation.vecTemp[4], impulseX, impulseY));
                this.constraint.bodyB.rotate(impulseAngle);

                this.constraint.bodyB.velocity.x += impulseX;
                this.constraint.bodyB.velocity.y += impulseY;
                this.constraint.bodyB.angle += impulseAngle;

                this.constraint.bodyB.constraintImpulse.x += impulseX;
                this.constraint.bodyB.constraintImpulse.y += impulseY;
                this.constraint.bodyB.angularVelocity += impulseAngle;
            }

            if (this.constraint.bodyA && !this.constraint.bodyA.isStatic) {
                const impulseX = impulseA.x * args.ratioA.x * this.stiffnessA;
                const impulseY = impulseA.y * args.ratioA.y * this.stiffnessA;
                const impulseAngle = Vector.cross(offsetA, impulseA) * args.ratioA.inertia * this.stiffnessA;
                
                this.constraint.bodyA.translate(Vector.set(Equation.vecTemp[4], -impulseX, -impulseY));
                
                this.constraint.bodyA.velocity.x -= impulseX;
                this.constraint.bodyA.velocity.y -= impulseY;
                this.constraint.bodyA.angularVelocity -= impulseAngle;

                this.constraint.bodyA.constraintImpulse.x -= impulseX;
                this.constraint.bodyA.constraintImpulse.y -= impulseY;
                this.constraint.bodyA.constraintImpulse.angle -= impulseAngle;

                const impulseAngleA = impulseA.angle * args.ratioA.inertia * this.stiffnessA;

                this.constraint.bodyA.rotate(-impulseAngle - impulseAngleA);
                this.constraint.bodyA.angularVelocity -= impulseAngleA;
                this.constraint.bodyA.constraintImpulse.angle -= impulseAngleA;
            }
        }
    }

    solveImpulse (body, angle, minAngle, maxAngle, scale, fromBtoA, distSquared, impulse) {
        let angleAbsolute = angle;

        if (body) {
            angleAbsolute = Common.angleDiff(angle, body.angle);
        }

        if (angleAbsolute > minAngle && angleAbsolute < maxAngle) return;

        const clampedAngle = Common.clampAngle(angleAbsolute, minAngle, maxAngle);
        const diff = Common.angleDiff(clampedAngle, angleAbsolute);

        Vector.rotate90(fromBtoA, impulse);
        Vector.neg(impulse);
        Vector.scale(impulse, diff / 2);

        const impulseMaxX = impulse.x;
        const impulseMaxY = impulse.y;

        Vector.divide(impulse, distSquared / 2);

        impulse.x = Common.absMin(impulse.x, impulseMaxX);
        impulse.y = Common.absMin(impulse.y, impulseMaxY);

        impulse.angle = diff * scale;

        return impulse;
    }
}