import { Composite } from '../../common/Composite';
import { Constraint } from '../../constraint/Constraint';
import { DistanceEquation } from '../../constraint/equation/DistanceEquation';
import { Vector } from '../../math/Vector';
import { Body } from '../../body/Body';
import { Circle } from '../../body/shapes/Circle';
import { Convex } from '../../body/shapes/Convex';
import { Filter } from '../../body/Filter';
import { Vertices } from '../../math/Vertices';

export const Factory = {};

Factory.rectangle = (position, width, heigth, bodyOptions = {}, shapeOptions = {}) => {

    bodyOptions.position = position;
    shapeOptions.vertices = [
        new Vector(-width / 2, -heigth / 2),
        new Vector(width / 2, -heigth / 2),
        new Vector(width / 2, heigth / 2),
        new Vector(-width / 2, heigth / 2),
    ]

    const rectangle = new Body(bodyOptions);
    rectangle.addShape(new Convex(shapeOptions));

    return rectangle;
}

Factory.circle = (position, radius, bodyOptions = {}, shapeOptions = {}) => {

    bodyOptions.position = position;
    const body = new Body(bodyOptions);
    shapeOptions.radius = radius;
    body.addShape(new Circle(shapeOptions));

    return body;

}

Factory.polygon = (position, sides = 4, radius = 2, bodyOptions = {}, shapeOptions = {}) => {

    const delta = Math.PI * 2 / sides;
    const vertices = [];

    for (let i = 0; i < sides; ++i) {
        const angle = delta * i;
        vertices.push(new Vector(
            Math.cos(angle) * radius,
            Math.sin(angle) * radius,
        ));
    }

    bodyOptions.position = position;
    shapeOptions.vertices = vertices;
    const body = new Body(bodyOptions);
    body.addShape(new Convex(shapeOptions));

    return body;
}

Factory.chain = (composite, offsetA, offsetB, constraintOptions = {}, equationOptions = {}) => {

    const bodies = composite.allBodies();

    for (let i = 1; i < bodies.length; ++i) {
        const bodyA = bodies[i - 1];
        const bodyB = bodies[i];
        const boundsA = bodyA.getBounds();
        const boundsB = bodyB.getBounds();

        constraintOptions.bodyA = bodyA;
        constraintOptions.bodyB = bodyB;
        if (offsetA) {
            constraintOptions.pointA = Vector.set(Vector.temp[0], boundsA.getWidth() * offsetA.x * 0.5, boundsA.getHeight() * offsetA.y * 0.5);
        }
        if (offsetB) {
            constraintOptions.pointB = Vector.set(Vector.temp[1], boundsB.getWidth() * offsetB.x * 0.5, boundsB.getHeight() * offsetB.y * 0.5);
        }

        const constraint = new Constraint (constraintOptions);
        const equation = new DistanceEquation(equationOptions);
        constraint.addEquation(equation);

        composite.addConstraint(constraint);
    }

    return composite;
}

Factory.car = (position, size = 1, composite = new Composite()) => {
    
    const group = Filter.nextGroup(true);

    const car = new Body({position});
    car.addShape(new Convex({
        vertices: [
            new Vector(-1.5 * size, 0.5 * size),
            new Vector(1.5 * size, 0.5 * size),
            new Vector(1.5 * size, 0.0),
            new Vector(0.0, -0.9 * size),
            new Vector(-1.15 * size, -0.9 * size),
            new Vector(-1.5 * size, -0.2 * size),
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

Factory.newtonsCradle = (position, count, radius, length, leftCount = 1, rightCount = 0, composite = new Composite()) => {

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
            circle.position.x -= halfHeight * 2;
            circle.position.y -= halfHeight * 2;
        } else if (i > count - rightCount - 1) {
            circle.position.x += halfHeight * 2;
            circle.position.y -= halfHeight * 2;
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

Factory.fromVertices = (position, vertices, bodyOptions = {}, shapeOptions = {}) => {

    const parts = Vertices.decomp(vertices);

    bodyOptions.position = position;
    const body = new Body(bodyOptions);

    for (const part of parts) {
        shapeOptions.vertices = part;
        body.addShape(new Convex(shapeOptions), false);
    }

    body.updateCenterOfMass();

    return body;
}