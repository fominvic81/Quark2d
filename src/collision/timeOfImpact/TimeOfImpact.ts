import { distance } from '../manager/narrowphase/Distance';
import { Settings } from '../../Settings';
import { Shape, ShapeType } from '../../body/shapes/Shape';
import { Vector } from '../../math/Vector';
import { Circle } from '../../body/shapes/Circle';



const circleCircleDist = (circleA: Circle, circleB: Circle) => {
    const normal = new Vector();

    Vector.subtract(circleB.position, circleA.position, normal);
    const dist = normal.length();
    if (dist === 0) {
        return {
            a: [circleA.position],
            b: [circleB.position],
            distance: 0,
            normal: normal.set(0, 0),
        }
    }

    normal.divide(dist);
    return {
        a: [circleA.position],
        b: [circleB.position],
        distance: dist,
        normal,
    }
}



const tolerance = Settings.slop * 0.5;
const temp = new Vector();
const normal = new Vector();
const normalA = new Vector();
const normalB = new Vector();
const pointATemp = new Vector();
const pointBTemp = new Vector();

export class TimeOfImpact {
    translationAT: Vector = new Vector();
    rotationAT: number = 0;
    rotationATCos: number = 0;
    rotationATSin: number = 0;
    
    translationBT: Vector = new Vector();
    rotationBT: number = 0;
    rotationBTCos: number = 0;
    rotationBTSin: number = 0;

    pointA: Vector = new Vector();
    pointB: Vector = new Vector();

    constructor () {

    }

    calcA (rotation: number, translation: Vector, t: number) {
        this.rotationAT = rotation * t;
        this.rotationATCos = Math.cos(this.rotationAT);
        this.rotationATSin = Math.sin(this.rotationAT);
        translation.clone(this.translationAT).scale(t);
    }
    
    calcB (rotation: number, translation: Vector, t: number) {
        this.rotationBT = rotation * t;
        this.rotationBTCos = Math.cos(this.rotationBT);
        this.rotationBTSin = Math.sin(this.rotationBT);
        translation.clone(this.translationBT).scale(t);
    }

    separation (shapeA: Shape, shapeB: Shape, pointA: Vector, pointB: Vector, normal: Vector)  {
        
        pointA.clone(pointATemp).rotateAboutU(this.rotationATCos, this.rotationATSin, shapeA.body!.center);
        pointATemp.add(this.translationAT);

        pointB.clone(pointBTemp).rotateAboutU(this.rotationBTCos, this.rotationBTSin, shapeB.body!.center);
        pointBTemp.add(this.translationBT);


        return Vector.dot(pointBTemp.subtract(pointATemp), normal);
    }

    findMinSeparation (shapeA: Shape, shapeB: Shape, a: Vector[], b: Vector[], normal: Vector) {
        normal.clone(normalA).rotateU(this.rotationATCos, -this.rotationATSin);
        normal.clone(normalB).rotateU(this.rotationBTCos, -this.rotationBTSin);

        normalB.neg();

        shapeA.support(normalA).clone(this.pointA);
        shapeB.support(normalB).clone(this.pointB);

        return this.separation(shapeA, shapeB, this.pointA, this.pointB, normal);
    }

    evaluate (shapeA: Shape, shapeB: Shape, normal: Vector) {
        return this.separation(shapeA, shapeB, this.pointA, this.pointB, normal);
    }

    timeOfImpact (shapeA: Shape, translationA: Vector, rotationA: number, shapeB: Shape, translationB: Vector, rotationB: number, dynamic: boolean, minT: number, maxT: number): number {
        
        const radius = shapeA.radius + shapeB.radius;
        const target = radius - (dynamic ? 25 : 10) * Settings.slop;
        let done = false;

        let t = minT;

        for (let i = 0; i < 30; ++i) {

            this.calcA(rotationA, translationA, t);
            this.calcB(rotationB, translationB, t);
    
            shapeA.translate(this.translationAT);
            shapeB.translate(this.translationBT);
            shapeA.rotateU(this.rotationATCos, this.rotationATSin);
            shapeB.rotateU(this.rotationBTCos, this.rotationBTSin);
            const dist = (shapeA.type === ShapeType.CIRCLE && shapeB.type === ShapeType.CIRCLE) ? circleCircleDist(<Circle>shapeA, <Circle>shapeB) : distance(shapeA, shapeB);
            shapeA.translate(this.translationAT.clone(temp).neg());
            shapeB.translate(this.translationBT.clone(temp).neg());
            shapeA.rotateU(this.rotationATCos, -this.rotationATSin);
            shapeB.rotateU(this.rotationBTCos, -this.rotationBTSin);

            if (!dist) break;
            if (dist.distance < target + tolerance) break;

            dist.normal.clone(normal);
            if (dist.b.length == 2) {
                normal.neg();
            }

            let t2 = maxT;

            for (let j = 0; j < 20; ++j) {

                this.calcA(rotationA, translationA, t2);
                this.calcB(rotationB, translationB, t2);
                const s = this.findMinSeparation(shapeA, shapeB, dist.a, dist.b, normal);

                if (s > target + tolerance) {
                    t = 1;
                    done = true;
                    break;
                }
                if (s > target - tolerance) {
                    t = t2;
                    break;
                }

                this.calcA(rotationA, translationA, t);
                this.calcB(rotationB, translationB, t);
                const e = this.evaluate(shapeA, shapeB, normal);

                if (e <= target + tolerance) {
                    done = true;
                    break;
                }

                let tl = t, tr = t2;

                for (let k = 0; k < 50; ++k) {

                    const m = (tl + tr) * 0.5;

                    this.calcA(rotationA, translationA, m);
                    this.calcB(rotationB, translationB, m);
                    const e2 = this.evaluate(shapeA, shapeB, normal);

                    if (Math.abs(e2 - target) < tolerance) {
                        t2 = m;
                        break;
                    }

                    if (e2 > target) {
                        tl = m;
                    } else {
                        tr = m;
                    }
                }

                
            }
            if (done) break;
        }

        return t;
    }
}