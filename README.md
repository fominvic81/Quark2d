# Quark2d

[Install](#install) - [Getting started](https://github.com/fominvic81/Quark2d/wiki/Getting-started) - [Example](#Example) - [Docs](https://fominvic81.github.io/Quark2d/index.html) - [Demos](https://fominvic81.github.io/Quark2d-Demo)

## Install

#### Npm
    npm install quark2d
#### Yarn
    yarn add quark2d

## Features

Rigid bodies

Circles, Polygons and Capsules

Multiple shapes attached to a single body

Friction and restitution

Dynamic, static and kinematic bodies

Sleeping bodies

Sensor shapes

Rounded shapes

Stable stacking

Warm starting

Mass, density, area

Constraints

Fast collsion detection and solving

Grid broadphase

Collision filtering

Events

## Example

Use the left mouse button to move the bodies.

Right mouse button to move the camera.

Mouse wheel to zoom.

    import {
        Engine,
        Render,
        Runner,
        Vector,
        MouseConstraint,
        Body,
        BodyType,
        Circle,
        Convex,
        Factory,
        SleepingType,
    } from 'quark2d';

    // Create engine
    const engine = new Engine();

    // Disable sleeping
    engine.sleeping.type = SleepingType.NO_SLEEPING;

    // Create an empty body
    const circleBody = new Body({
        position: new Vector(0, 9),
    });

    // Create a circle shape
    const circleShape = new Circle({
        radius: 0.5
    });

    // Add the circle shape to the body
    circleBody.addShape(circleShape);

    // Add the the body to the world
    engine.world.add(circleBody);

    // Create boxes
    for (let i = 0; i < 8; ++i) {
        for (let j = 0; j < 5; ++j) {
            engine.world.add(Factory.Body.rectangle(new Vector(i - 3.5, j), 0, 0.8, 0.8, {}, {radius: 0.05}));
        }
    }

    // Create an empty static body
    const ground = new Body({
        position: new Vector(0, 10),
        type: BodyType.static,
    });

    // Create rectangular shape
    const groundShape = new Convex({
        vertices: [
            new Vector(-15, -0.5),
            new Vector(15, -0.5),
            new Vector(15, 0.5),
            new Vector(-15, 0.5),
        ],
        radius: 0.1, // Rounding radius
    });

    // Add the rectangular shape to the body
    ground.addShape(groundShape);

    // Add the the body to the world
    engine.world.add(ground);

    // Create a render
    const render = new Render(engine, {
        element: document.body,
        width: 800,
        height: 600,
    });

    // Create a mouse constraint
    const mouseConstraint = new MouseConstraint(engine, render.mouse);

    // Create a runner
    const runner = new Runner();
    runner.events.on('update', (ts) => {
        engine.update(ts);
    })
    runner.events.on('render', (ts) => {
        render.step(ts);
    });

    // Run the runner
    runner.run();
    runner.runRender();