
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

    static isCollinear (vectorA, vectorB) {
        return (Math.abs(vectorA.x / vectorA.y - vectorB.x / vectorB.y) < 0.0001) || (vectorA.y === 0 && vectorB.y === 0);
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

    static getSide (vector, point) {
        const cross = Vector.cross(vector, point);
        if (cross > 0.001) return 1; // right
        if (cross < -0.001) return -1; // left
        return 0; // on
    }

    static lineLineIntersection (start1, end1, start2, end2) {
        
        const vector = Vector.subtract(end1, start1, Vector.temp[0]);
        const start = Vector.subtract(start2, start1, Vector.temp[1]);
        const end = Vector.subtract(end2, start1, Vector.temp[2]);

        if (Vector.getSide(vector, start) !== Vector.getSide(vector, end)) {

            Vector.subtract(end2, start2, vector);
            Vector.subtract(start1, start2, start);
            Vector.subtract(end1, start2, end);

            if (Vector.getSide(vector, start) !== Vector.getSide(vector, end)) {
                return true;
            }
        }
        return false;
    }
};

Vector.temp = [
    new Vector(), new Vector(),
    new Vector(), new Vector(),
    new Vector(), new Vector(),
    new Vector(),
];

Vector.zero = new Vector(0, 0);