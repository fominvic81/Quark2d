import { Composite } from '../../common/Composite';
import { Constraint } from '../../constraint/Constraint';
import { DistanceEquation } from '../../constraint/equation/DistanceEquation';
import { Vector } from '../../math/Vector';
import { Body } from '../../body/Body';
import { Circle } from '../../body/shapes/Circle';
import { Convex } from '../../body/shapes/Convex';
import { Edge } from '../../body/shapes/Edge';
import { Filter } from '../../body/Filter';
import { Common } from '../../common/Common';
import { Vertices } from '../../math/Vertices';

export const Factory = {};

Factory.Shape = {};
Factory.Body = {};
Factory.Composite = {};

//////////////////////////// Shape ////////////////////////////

Factory.Shape.circle = (radius, options) => {
    options.radius = radius;
    return new Circle(options);
}

Factory.Shape.capsule = (length, radius, options) => {

    options.start = new Vector(-length * 0.5, 0);
    options.end = new Vector(length * 0.5, 0);
    options.radius = radius;

    return new Edge(options);
}

Factory.Shape.rectangle = (width, heigth, options) => {
    options.vertices = [
        new Vector(-width / 2, -heigth / 2),
        new Vector(width / 2, -heigth / 2),
        new Vector(width / 2, heigth / 2),
        new Vector(-width / 2, heigth / 2),
    ];

    return new Convex(options);
}

Factory.Shape.polygon = (sides = 4, radius = 1, options = {}) => {

    if (sides === 1) {
        return Factory.Shape.circle(radius, options);
    } else if (sides === 2) {
        return Factory.Shape.capsule(radius * 2, undefined, options);
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

Factory.Shape.fromVertices = (vertices, options = {}) => {

    const output = [];
    const parts = Vertices.decomp(vertices);

    for (const part of parts) {
        options.vertices = part;
        output.push(new Convex(options));
    }

    return output;
}

//////////////////////////// Body ////////////////////////////

Factory.Body.circle = (position, radius, bodyOptions = {}, shapeOptions = {}) => {

    bodyOptions.position = position;
    const body = new Body(bodyOptions);

    shapeOptions.radius = radius;
    body.addShape(new Circle(shapeOptions));

    return body;
}

Factory.Body.capsule = (position, angle, length, radius, bodyOptions = {}, shapeOptions ={}) => {

    bodyOptions.position = position;
    bodyOptions.angle = angle;
    const body = new Body(bodyOptions);
    const shape = Factory.Shape.capsule(length, radius, shapeOptions);
    body.addShape(shape);

    return body;
}

Factory.Body.rectangle = (position, angle, width, heigth, bodyOptions = {}, shapeOptions = {}) => {

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

Factory.Body.polygon = (position, sides = 4, radius = 1, bodyOptions = {}, shapeOptions = {}) => {

    bodyOptions.position = position;
    const body = new Body(bodyOptions);
    const shape = Factory.Shape.polygon(sides, radius, shapeOptions);
    body.addShape(shape);

    return body;
}

Factory.Body.fromVertices = (position, vertices, bodyOptions = {}, shapeOptions = {}) => {

    bodyOptions.position = position;
    const body = new Body(bodyOptions);
    const shapes = Factory.Shape.fromVertices(vertices, shapeOptions);

    for (const shape of shapes) {
        body.addShape(shape, false);
    }

    body.updateCenterOfMass();

    return body;
}

//////////////////////////// Composite ////////////////////////////

Factory.Composite.car = (position, size = 1, composite = new Composite()) => {
    
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

    const frontConstraint = new Constraint({
        bodyA: car,
        bodyB: frontWheel,
        pointA: new Vector(size, 0.5 * size),
    });
    const frontDistEquation = new DistanceEquation({
        stiffness: 1,
    });
    frontConstraint.addEquation(frontDistEquation);

    const backConstraint = new Constraint({
        bodyA: car,
        bodyB: backWheel,
        pointA: new Vector(-size, 0.5 * size),
    });
    const backDistEquation = new DistanceEquation({
        stiffness: 1,
    });
    backConstraint.addEquation(backDistEquation);

    composite.addBody([car, frontWheel, backWheel]);
    composite.addConstraint([frontConstraint, backConstraint]);

    return composite;
}

Factory.Composite.newtonsCradle = (position, count, radius, length, leftCount = 1, rightCount = 0, composite = new Composite()) => {

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
            frictionStatic: 0,
        }));

        if (i < leftCount) {
            circle.translate(new Vector(-halfHeight * 2, -halfHeight * 2));
        } else if (i > count - rightCount - 1) {
            circle.translate(new Vector(halfHeight * 2, -halfHeight * 2));
        }
        
        const constraint = new Constraint({
            bodyA: circle,
            pointB: new Vector(i * radius * 2 + position.x - halfWidth, position.y - halfHeight),
        });
        const equation = new DistanceEquation({
            stiffness: 1,
        });
        constraint.addEquation(equation);

        composite.addBody(circle);
        composite.addConstraint(constraint);
    }

    return composite;
}