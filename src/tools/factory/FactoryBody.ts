import { Vector } from '../../math/Vector';
import { Body, BodyOptions } from '../../body/Body';
import { CircleOptions } from '../../body/shapes/Circle';
import { ConvexOptions } from '../../body/shapes/Convex';
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
        body.addShape(Factory.Shape.circle(position, radius, shapeOptions));
    
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
        const shape = Factory.Shape.capsule(position, angle, length, radius, shapeOptions);
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

        const rectangle = new Body(bodyOptions);
        rectangle.addShape(Factory.Shape.rectangle(position, angle, width, heigth, shapeOptions));
    
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
        const shape = Factory.Shape.polygon(position, sides, radius, shapeOptions);
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
    static fromVertices (position: Vector, vertices: Vector[], bodyOptions: BodyOptions = {}, shapeOptions: ConvexOptions = {}): Body {
    
        const body = new Body(bodyOptions);
        const shapes = Factory.Shape.fromVertices(vertices, shapeOptions);
    
        for (const shape of shapes) {
            body.addShape(shape);
        }
        body.translate(position);

        return body;
    }

    /**
     * Creates an ellipse(many sided polygon). Quality by default is 6.
     * @param position
     * @param radiusX
     * @param radiusY
     * @param quality
     * @param bodyOptions
     * @param shapeOptions
     * @returns An ellipse
     */
    static ellipse (position: Vector, angle: number, radiusX: number, radiusY: number, quality: number = 6, bodyOptions: BodyOptions = {}, shapeOptions: ConvexOptions = {}): Body {

        bodyOptions.position = position;
        const body = new Body(bodyOptions);
        const shape = Factory.Shape.ellipse(position, angle, radiusX, radiusY, quality, shapeOptions);
        body.addShape(shape);

        return body
    }
}