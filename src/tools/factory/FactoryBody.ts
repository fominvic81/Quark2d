import { Vector } from '../../math/Vector';
import { Body, BodyOptions } from '../../body/Body';
import { Circle, CircleOptions } from '../../body/shapes/Circle';
import { Convex, ConvexOptions } from '../../body/shapes/Convex';
import { EdgeOptions } from '../../body/shapes/Edge';
import { Factory } from './Factory';


export class FactoryBody {
    /**
     * Creates circle body.
     * @param position
     * @param radius
     * @param bodyOptions
     * @param shapeOptions
     * @returns A new circle body
     */
    static circle (position: Vector, radius: number, bodyOptions: BodyOptions = {}, shapeOptions: CircleOptions = {}): Body {

        bodyOptions.position = position;
        const body = new Body(bodyOptions);
    
        shapeOptions.radius = radius;
        body.addShape(new Circle(shapeOptions));
    
        return body;
    }

    /**
     * Creates capsule body.
     * @param position
     * @param angle
     * @param length
     * @param radius
     * @param bodyOptions
     * @param shapeOptions
     * @returns A new capsule body
     */
    static capsule (position: Vector, angle: number, length: number, radius: number, bodyOptions: BodyOptions = {}, shapeOptions: EdgeOptions ={}): Body {
    
        bodyOptions.position = position;
        bodyOptions.angle = angle;
        const body = new Body(bodyOptions);
        const shape = Factory.Shape.capsule(length, radius, shapeOptions);
        body.addShape(shape);
    
        return body;
    }

    /**
     * Creates rectangle body.
     * @param position
     * @param angle
     * @param width
     * @param heigth
     * @param bodyOptions
     * @param shapeOptions
     * @returns A new rectangle body
     */
    static rectangle (position: Vector, angle: number, width: number, heigth: number, bodyOptions: BodyOptions = {}, shapeOptions: ConvexOptions = {}): Body {
    
        bodyOptions.position = position;
        bodyOptions.angle = angle;
        shapeOptions.vertices = [
            new Vector(-width / 2, -heigth / 2),
            new Vector(width / 2, -heigth / 2),
            new Vector(width / 2, heigth / 2),
            new Vector(-width / 2, heigth / 2),
        ];
    
        const rectangle = new Body(bodyOptions);
        rectangle.addShape(new Convex(shapeOptions));
    
        return rectangle;
    }

    /**
     * Creates regular polygon.
     * @param position
     * @param sides
     * @param radius
     * @param bodyOptions
     * @param shapeOptions
     * @returns A new regular polygon
     */
    static polygon (position: Vector, sides: number = 4, radius: number = 1, bodyOptions: BodyOptions = {}, shapeOptions: ConvexOptions = {}): Body {
    
        bodyOptions.position = position;
        const body = new Body(bodyOptions);
        const shape = Factory.Shape.polygon(sides, radius, shapeOptions);
        body.addShape(shape);
    
        return body;
    }

    /**
     * Creates a body from set of vertices. If the vertices are concave, uses poly-decomp(https://github.com/schteppe/poly-decomp.js).
     * @param position
     * @param vertices
     * @param bodyOptions
     * @param shapeOptions
     * @returns A new body created from set of vertices
     */
    static fromVertices (position: Vector, vertices: Array<Vector>, bodyOptions: BodyOptions = {}, shapeOptions: ConvexOptions = {}): Body {
    
        bodyOptions.position = position;
        const body = new Body(bodyOptions);
        const shapes = Factory.Shape.fromVertices(vertices, shapeOptions);
    
        for (const shape of shapes) {
            body.addShape(shape, false);
        }
    
        body.updateCenterOfMass();
    
        return body;
    }
}