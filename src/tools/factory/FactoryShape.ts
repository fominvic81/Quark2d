import { Vector } from '../../math/Vector';
import { Circle, CircleOptions } from '../../body/shapes/Circle';
import { Convex, ConvexOptions } from '../../body/shapes/Convex';
import { Edge, EdgeOptions } from '../../body/shapes/Edge';
import { Common } from '../../common/Common';
import { Vertices } from '../../math/Vertices';

export class FactoryShape {

    static circle (position: Vector, radius: number, options: CircleOptions = {}): Circle {
        options.position = position;
        options.radius = radius;
        return new Circle(options);
    }
    
    static capsule (position: Vector, angle: number, length: number, radius: number, options: EdgeOptions = {}): Edge {
    
        options.start = new Vector(-length * 0.5, 0).add(position);
        options.end = new Vector(length * 0.5, 0).add(position);
        options.angle = angle;
        options.radius = radius;
    
        return new Edge(options);
    }
    
    static rectangle (position: Vector, angle: number, width: number, heigth: number, options: ConvexOptions = {}): Convex {
        options.vertices = [
            new Vector(-width / 2, -heigth / 2).add(position),
            new Vector(width / 2, -heigth / 2).add(position),
            new Vector(width / 2, heigth / 2).add(position),
            new Vector(-width / 2, heigth / 2).add(position),
        ];
        options.angle = angle;
        return new Convex(options);
    }
    
    static polygon (position: Vector, sides: number = 4, radius: number = 1, options: ConvexOptions = {}): Convex {
    
        if (sides < 3) {
            console.warn('Sides must be at least 3');
        }
    
        const delta = Common.PI2 / sides;
        const initAngle = (delta + Math.PI) * 0.5;
        const vertices = [];
    
        for (let i = 0; i < sides; ++i) {
            const angle = initAngle + delta * i;
            vertices.push(new Vector(
                Math.cos(angle) * radius,
                Math.sin(angle) * radius,
            ).add(position));
        }
        options.vertices = vertices;
        return new Convex(options);
    }
    
    static fromVertices (vertices: Vector[], options: ConvexOptions = {}): Convex[] {
    
        const output = [];
        const parts = Vertices.decomp(vertices);
    
        for (const part of parts) {
            options.vertices = part;
            output.push(new Convex(options));
        }
    
        return output;
    }

    static ellipse (position: Vector, angle: number, radiusX: number, radiusY: number, quality: number = 6, options: ConvexOptions = {}): Convex {
        const sides = quality * 4;

        const delta = Common.PI2 / sides;
        const initAngle = (delta + Math.PI) * 0.5;
        const vertices = [];
    
        for (let i = 0; i < sides; ++i) {
            const angle = initAngle + delta * i;
            vertices.push(new Vector(
                Math.cos(angle) * radiusX,
                Math.sin(angle) * radiusY,
            ).add(position));
        }
        options.vertices = vertices;
        options.angle = angle;
        return new Convex(options);
    }
}