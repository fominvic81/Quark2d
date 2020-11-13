# Quark2d

[Install](#install) - [Getting started](https://github.com/fominvic81/Quark2d/wiki/Getting-started) - [Example](#Example) - [Docs](https://github.com/fominvic81/Quark2d/wiki/Documentation)

## Install

#### Npm
    npm install quark2d
#### Yarn
    yarn add quark2d

## Example

    import {
        Engine,
        Render,
        Runner,
        Vector,
        MouseConstraint,
        Body,
        Circle,
        Convex,
    } from 'quark2d';
    
    // Create engine
    const engine = new Engine();

    // Create an empty body
    const circleBody = new Body({
        position: new Vector(0, 0)
    });

    // Create a circle shape
    const circleShape = new Circle({
        radius: 0.5
    });

    // Add the circle shape to body
    circleBody.addShape(circleShape);

    // Add the the body to the world
    engine.world.add(circleBody);

    // Create an empty body
    const ground = new Body({
        position: new Vector(0, 10),
        isStatic: true
    });

    // Create rectangle shape
    const groundShape = new Convex({
        vertices: [
            new Vector(-10, -0.5),
            new Vector(10, -0.5),
            new Vector(10, 0.5),
            new Vector(-10, 0.5),
        ]
    });

    // Add the circle shape to body
    ground.addShape(groundShape);

    // Add the the body to the world
    engine.world.add(ground);

    // Create a render
    const render = new Render(engine, {
        element: document.body,
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

    // Run runner
    runner.run();
    runner.runRender();