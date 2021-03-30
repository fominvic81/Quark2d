import { Composite } from '../../common/Composite';
import { Vector } from '../../math/Vector';
import { Body, BodyOptions } from '../../body/Body';
import { Circle, CircleOptions } from '../../body/shapes/Circle';
import { Convex, ConvexOptions } from '../../body/shapes/Convex';
import { Edge, EdgeOptions } from '../../body/shapes/Edge';
import { Filter } from '../../body/Filter';
import { Common } from '../../common/Common';
import { Vertices } from '../../math/Vertices';
import { DistanceConstraint } from '../../constraint/DistanceConstraint';

export class Factory {

    static Shape = class {
        static circle (radius: number, options: CircleOptions = {}): Circle {
            options.radius = radius;
            return new Circle(options);
        }
        
        static capsule (length: number, radius: number, options: EdgeOptions = {}): Edge {
        
            options.start = new Vector(-length * 0.5, 0);
            options.end = new Vector(length * 0.5, 0);
            options.radius = radius;
        
            return new Edge(options);
        }
        
        static rectangle (width: number, heigth: number, options: ConvexOptions = {}): Convex {
            options.vertices = [
                new Vector(-width / 2, -heigth / 2),
                new Vector(width / 2, -heigth / 2),
                new Vector(width / 2, heigth / 2),
                new Vector(-width / 2, heigth / 2),
            ];
        
            return new Convex(options);
        }
        
        static polygon (sides: number = 4, radius: number = 1, options: ConvexOptions = {}): Convex {
        
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
                ));
            }
            
            options.vertices = vertices;
            return new Convex(options);
        }
        
        static fromVertices (vertices: Array<Vector>, options: ConvexOptions = {}): Array<Convex> {
        
            const output = [];
            const parts = Vertices.decomp(vertices);
        
            for (const part of parts) {
                options.vertices = part;
                output.push(new Convex(options));
            }
        
            return output;
        }
    }

    static Body = class {
        static circle (position: Vector, radius: number, bodyOptions: BodyOptions = {}, shapeOptions: CircleOptions = {}): Body {

            bodyOptions.position = position;
            const body = new Body(bodyOptions);
        
            shapeOptions.radius = radius;
            body.addShape(new Circle(shapeOptions));
        
            return body;
        }
        
        static capsule (position: Vector, angle: number, length: number, radius: number, bodyOptions: BodyOptions = {}, shapeOptions: EdgeOptions ={}): Body {
        
            bodyOptions.position = position;
            bodyOptions.angle = angle;
            const body = new Body(bodyOptions);
            const shape = Factory.Shape.capsule(length, radius, shapeOptions);
            body.addShape(shape);
        
            return body;
        }
        
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
        
        static polygon (position: Vector, sides: number = 4, radius: number = 1, bodyOptions: BodyOptions = {}, shapeOptions: ConvexOptions = {}): Body {
        
            bodyOptions.position = position;
            const body = new Body(bodyOptions);
            const shape = Factory.Shape.polygon(sides, radius, shapeOptions);
            body.addShape(shape);
        
            return body;
        }
        
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

    static Composite = class {
        static car (position: Vector, size: number = 1, composite: Composite = new Composite()): Composite {
    
            const group = Filter.nextGroup(true);
        
            const car = new Body({position});
            car.addShape(new Convex({
                vertices: [
                    new Vector(-1.5 * size, -0.2 * size),
                    new Vector(-1.2 * size, -0.9 * size),
                    new Vector(0.0, -0.9 * size),
                    new Vector(1.5 * size, 0.0),
                    new Vector(1.5 * size, 0.5 * size),
                    new Vector(-1.5 * size, 0.5 * size),
                ],
                filter: {group},
            }));
        
            const frontWheel = new Body({position: new Vector(position.x + size, position.y + size * 0.5)});
            frontWheel.addShape(new Circle({
                radius: 0.4 * size,
                filter: {group},
            }));
        
            const backWheel = new Body({position: new Vector(position.x - size, position.y + size * 0.5)});
            backWheel.addShape(new Circle({
                radius: 0.4 * size,
                filter: {group},
            }));
        
            const frontConstraint = new DistanceConstraint({
                bodyA: car,
                bodyB: frontWheel,
                pointA: new Vector(size, 0.5 * size),
                stiffness: 1,
            });
        
            const backConstraint = new DistanceConstraint({
                bodyA: car,
                bodyB: backWheel,
                pointA: new Vector(-size, 0.5 * size),
                stiffness: 1,
            });
        
            composite.addBody([car, frontWheel, backWheel]);
            composite.addConstraint([frontConstraint, backConstraint]);
        
            return composite;
        }
        
        static newtonsCradle (position: Vector, count: number, radius: number, length: number, leftCount: number = 1, rightCount: number = 0, composite: Composite = new Composite()): Composite {
        
            const halfWidth = radius * count - radius;
            const halfHeight = length / 2 + radius;
        
            for (let i = 0; i < count; ++i) {
        
                const circle = new Body({
                    position: new Vector(
                        i * radius * 2 + position.x - halfWidth,
                        position.y + halfHeight,
                    ),
                    velocityDamping: 0,
                });
                circle.addShape(new Circle({
                    radius,
                    inertia: Infinity,
                    restitution: 1,
                    friction: 0,
                }));
        
                if (i < leftCount) {
                    circle.translate(new Vector(-halfHeight * 2, -halfHeight * 2));
                } else if (i > count - rightCount - 1) {
                    circle.translate(new Vector(halfHeight * 2, -halfHeight * 2));
                }
                
                const constraint = new DistanceConstraint({
                    bodyA: circle,
                    pointB: new Vector(i * radius * 2 + position.x - halfWidth, position.y - halfHeight),
                    stiffness: 1,
                });
        
                composite.addBody(circle);
                composite.addConstraint(constraint);
            }
        
            return composite;
        }
    }

}