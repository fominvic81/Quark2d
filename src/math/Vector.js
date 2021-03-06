import { Common } from '../common/Common';

export class Vector {

    constructor (x = 0, y = 0) {
        this.x = x;
        this.y = y;
    }


    static clone (vector, output = undefined) {
        if (output) {
            output.x = vector.x;
            output.y = vector.y;
            return output;
        }
        return new Vector(vector.x, vector.y);
    }

    static set (vector, x, y) {
        vector.x = x;
        vector.y = y;
        return vector;
    }

    static rotate (vector, angle, output = vector) {
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        const x = vector.x;
        const y = vector.y;
        output.x = x * cos - y * sin;
        output.y = x * sin + y * cos;
        return output;
    }

    static angle (vectorA, vectorB = undefined) {
        if (vectorB) {
            return Math.atan2(vectorB.y - vectorA.y, vectorB.x - vectorA.x);
        } else {
            return Math.atan2(vectorA.y, vectorA.x);
        }
    };

    static length (vector) {
        return Math.sqrt(Math.pow(vector.x, 2) + Math.pow(vector.y, 2));
    }

    static lengthSquared (vector) {
        return Math.pow(vector.x, 2) + Math.pow(vector.y, 2);
    }

    static normalise (vector, output = vector) {
        const length = Vector.length(vector);
        output.x = vector.x / length;
        output.y = vector.y / length;
        return output;
    }

    static dist (vectorA, vectorB) {
        return Math.sqrt(Math.pow((vectorA.x - vectorB.x), 2) + Math.pow((vectorA.y - vectorB.y), 2));
    }

    static distSquared (vectorA, vectorB) {
        return Math.pow((vectorA.x - vectorB.x), 2) + Math.pow((vectorA.y - vectorB.y), 2);
    }

    static dot (vectorA, vectorB) {
        return (vectorA.x * vectorB.x) + (vectorA.y * vectorB.y);
    }

    static cross (vectorA, vectorB) {
        return (vectorA.x * vectorB.y) - (vectorA.y * vectorB.x);
    }

    static add (vectorA, vectorB, output = vectorA) {
        output.x = vectorA.x + vectorB.x;
        output.y = vectorA.y + vectorB.y;
        return output;
    }

    static subtract (vectorA, vectorB, output = vectorA) {
        output.x = vectorA.x - vectorB.x;
        output.y = vectorA.y - vectorB.y;
        return output;
    }

    static scale (vector, s, output = vector) {
        output.x = vector.x * s;
        output.y = vector.y * s;
        return output;
    }

    static divide (vector, s, output = vector) {
        output.x = vector.x / s;
        output.y = vector.y / s;
        return output;
    }

    static mult (vectorA, vectorB, output = vectorA) {
        output.x = vectorA.x * vectorB.x;
        output.y = vectorA.y * vectorB.y;
        return output;
    }

    static neg (vector, output = vector) {
        output.x = -vector.x;
        output.y = -vector.y;
        return output;
    }

    static rotate90 (vector, output = vector) {
        const x = vector.x;
        output.x = -vector.y;
        output.y = x;
        return output;
    }

    static rotate270 (vector, output = vector) {
        const x = vector.x;
        output.x = vector.y;
        output.y = -x;
        return output;
    }

    static isCollinear (vectorA, vectorB) {
        return (Math.abs(vectorA.x / vectorA.y - vectorB.x / vectorB.y) < 0.0001) || (vectorA.y === 0 && vectorB.y === 0);
    }

    static interpolate (vectorA, vectorB, t, output) {
        output.x = vectorA.x + t * (vectorB.x - vectorA.x);
        output.y = vectorA.y + t * (vectorB.y - vectorA.y);
        return output;
    }

    static rayRayIntersectionPoint (start1, end1, start2, end2, output = new Vector()) {
        
        const a1 = end1.y - start1.y; 
        const b1 = start1.x - end1.x; 
        const c1 = a1*(start1.x) + b1*(start1.y); 
        
        const a2 = end2.y - start2.y; 
        const b2 = start2.x - end2.x; 
        const c2 = a2*(start2.x) + b2*(start2.y); 
        
        const determinant = a1*b2 - a2*b1; 
        
        if (determinant === 0) {
            return; 
        } 
        else { 
            Vector.set(output, (b2*c1 - b1*c2)/determinant, (a1*c2 - a2*c1)/determinant);
            return output;
        }
    }

    static lineLineIntersection (start1, end1, start2, end2, output) {
        const t = Vector.lineLineIntersectionFraction(start1, end1, start2, end2);
        if(t < 0){
            return false;
        } else {
            output.x = start1.x + (t * (end1.x - start1.x));
            output.y = start1.y + (t * (end1.y - start1.y));
            return output;
        }
    };

    static lineLineIntersectionFraction (start1, end1, start2, end2) {
        const deltaX1 = end1.x - start1.x;
        const deltaY1 = end1.y - start1.y;
        const deltaX2 = end2.x - start2.x;
        const deltaY2 = end2.y - start2.y;

        const deltaStartX = start1.y - start2.y;
        const deltaStartY = start1.x - start2.x;
    
        const determinant = deltaX1 * deltaY2 - deltaX2 * deltaY1;
    
        let a = (deltaX1 * deltaStartX - deltaY1 * deltaStartY) / determinant;
        if (a < 0 || a > 1) return -1;
        let b = (deltaX2 * deltaStartX - deltaY2 * deltaStartY) / determinant;
        if (b < 0 || b > 1) return -1;
        return b;
    };

    static zeroT (vectorA, vectorB) {
        const delta = Vector.subtract(vectorB, vectorA, Vector._prTemp[0]);
        return -Common.clamp(
            Vector.dot(delta, Vector.add(vectorA, vectorB, Vector._prTemp[1])) / (Vector.lengthSquared(delta)),
            -1, 1,
        );
    }

    static interpolateT (vectorA, vectorB, t, output = new Vector()) {
        const halfT = 0.5 * t;
        return Vector.add(
            Vector.scale(vectorA, 0.5 - halfT, Vector._prTemp[0]),
            Vector.scale(vectorB, 0.5 + halfT, Vector._prTemp[1]),
            output,
        );
    }

    static distSquaredToZero (v1, v2) {
        return Vector.lengthSquared(Vector.interpolateT(v1, v2, Vector.zeroT(v1, v2), Vector._prTemp[0]));
    }
    
    static side (a, b, c) {
        return (b.y - a.y) * (a.x + b.x - 2 * c.x) > (b.x - a.x) * (a.y + b.y - 2 * c.y);
    }
    
    static zeroSide (a, b) {
        return (b.y - a.y) * (a.x + b.x) > (b.x - a.x) * (a.y + b.y);
    }

    static swap (vectorA, vectorB) {
        [vectorA.x, vectorB.x] = [vectorB.x, vectorA.x];
        [vectorA.y, vectorB.y] = [vectorB.y, vectorA.y];
    }
};

Vector.temp = [
    new Vector(), new Vector(),
    new Vector(), new Vector(),
    new Vector(), new Vector(),
    new Vector(),
];

Vector.zero = new Vector(0, 0);

Vector._prTemp = [
    new Vector(), new Vector,
];