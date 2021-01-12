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
        const dist = args.dist;

        const offsetA = args.offsetA;
        const offsetB = args.offsetB;

        let impulseA;
        let impulseB;

        if (this.stiffnessA) {
            impulseA = this.solveImpulse(this.constraint.bodyA, angle, this.minAngleA, this.maxAngleA, 1, fromBtoA, dist, Equation.vecTemp[0]);
        }
        if (this.stiffnessB) {
            impulseB = this.solveImpulse(this.constraint.bodyB, angle, this.minAngleB, this.maxAngleB, -1, fromBtoA, dist, Equation.vecTemp[1]);
        }

        if (impulseB) {
            if (this.constraint.bodyA && !this.constraint.bodyA.isStatic) {
                this.constraint.impulseA.x += impulseB.x * this.stiffnessB;
                this.constraint.impulseA.y += impulseB.y * this.stiffnessB;
                this.constraint.impulseA.angle += Vector.cross(offsetA, impulseB) * this.stiffnessB;
            }

            if (this.constraint.bodyB && !this.constraint.bodyB.isStatic) {
                this.constraint.impulseB.x += impulseB.x * this.stiffnessB;
                this.constraint.impulseB.y += impulseB.y * this.stiffnessB;
                this.constraint.impulseB.angle += (Vector.cross(offsetB, impulseB) + impulseB.angle) * this.stiffnessB;
            }
        }

        if (impulseA) {
            if (this.constraint.bodyB && !this.constraint.bodyB.isStatic) {
                this.constraint.impulseB.x += impulseA.x * this.stiffnessA;
                this.constraint.impulseB.y += impulseA.y * this.stiffnessA;
                this.constraint.impulseB.angle += Vector.cross(offsetB, impulseA) * this.stiffnessA;
            }

            if (this.constraint.bodyA && !this.constraint.bodyA.isStatic) {                
                this.constraint.impulseA.x += impulseA.x * this.stiffnessA;
                this.constraint.impulseA.y += impulseA.y * this.stiffnessA;
                this.constraint.impulseA.angle += (Vector.cross(offsetA, impulseA) + impulseA.angle) * this.stiffnessA;
            }
        }
    }

    solveImpulse (body, angle, minAngle, maxAngle, scale, fromBtoA, dist, impulse) {
        let angleAbsolute = angle;

        if (body) {
            angleAbsolute = Common.angleDiff(angle, body.constraintAngle);
        }

        if (angleAbsolute > minAngle && angleAbsolute < maxAngle) return;

        const clampedAngle = Common.clampAngle(angleAbsolute, minAngle, maxAngle);
        const diff = Common.angleDiff(clampedAngle, angleAbsolute);

        Vector.rotate90(fromBtoA, impulse);
        Vector.neg(impulse);
        Vector.scale(impulse, diff / 2);

        const impulseMaxX = impulse.x;
        const impulseMaxY = impulse.y;

        Vector.divide(impulse, dist);

        impulse.x = Common.absMin(impulse.x, impulseMaxX);
        impulse.y = Common.absMin(impulse.y, impulseMaxY);

        impulse.angle = diff * scale;

        return impulse;
    }
}