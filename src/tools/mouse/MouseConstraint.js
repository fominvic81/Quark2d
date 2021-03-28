import { Events } from '../../common/Events';
import { Vector } from '../../math/Vector';
import { DistanceConstraint } from '../../constraint/DistanceConstraint';

export class MouseConstraint {
    
    constructor (engine, mouse, constraints = [new DistanceConstraint({stiffness: 0.2, length: 0})]) {

        this.engine = engine;
        this.mouse = mouse;
        this.constraints = constraints;
        this.events = new Events();

        engine.world.addConstraint(this.constraints);

        this.mouse.events.on('mouse-down', (event) => {this.mouseDown(event)});
        this.mouse.events.on('mouse-up', (event) => {this.mouseUp(event)});
        this.mouse.events.on('mouse-move', (event) => {this.mouseMove(event)});

    }

    mouseDown (event) {
        if (!this.mouse.leftButtonPressed) return;
        for (const body of this.engine.world.bodies.values()) {
            if (body.isStatic) continue;
            for (const shape of body.shapes) {
                if (shape.bounds.contains(event.position)) {
                    if (shape.contains(event.position)) {
                        for (const constraint of this.constraints) {
                            constraint.bodyA = body;
                            Vector.subtract(event.position, body.position, constraint.pointA).rotate(-body.angle);
                            this.events.trigger('catch-body', [{body, shape}]);
                        }
                        break;
                    }
                }
            }
        }
    }

    mouseUp (event) {
        if (this.mouse.leftButtonPressed) return;
        for (const constraint of this.constraints) {
            constraint.bodyA = undefined;
        }
    }

    mouseMove (event) {
        for (const constraint of this.constraints) {
            constraint.pointB.x = event.position.x;
            constraint.pointB.y = event.position.y;
        }
    }

}