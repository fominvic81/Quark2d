import { Events } from '../../common/Events';
import { Vector } from '../../math/Vector';
import { DistanceConstraint } from '../../constraint/DistanceConstraint';
import { Engine } from '../../engine/Engine';
import { Mouse, QMouseEvent } from './Mouse';
import { Constraint } from '../../constraint/Constraint';

export class MouseConstraint {
    engine: Engine;
    mouse: Mouse;
    constraints: Array<Constraint>;
    events = new Events();
    
    constructor (engine: Engine, mouse: Mouse, constraints: Array<Constraint> = [new DistanceConstraint({stiffness: 0.2, length: 0})]) {

        this.engine = engine;
        this.mouse = mouse;
        this.constraints = constraints;

        engine.world.addConstraint(this.constraints);

        this.mouse.events.on('mouse-down', (event: QMouseEvent) => {this.mouseDown(event)});
        this.mouse.events.on('mouse-up', (event: QMouseEvent) => {this.mouseUp(event)});
        this.mouse.events.on('mouse-move', (event: QMouseEvent) => {this.mouseMove(event)});

    }

    mouseDown (event: QMouseEvent) {
        if (!event.mouse.leftButtonPressed) return;
        for (const body of this.engine.world.bodies.values()) {
            if (body.isStatic) continue;
            for (const shape of body.shapes) {
                if (shape.bounds.contains(event.mouse.position)) {
                    if (shape.contains(event.mouse.position)) {
                        for (const constraint of this.constraints) {
                            constraint.bodyA = body;
                            Vector.subtract(event.mouse.position, body.position, constraint.pointA).rotate(-body.angle);
                            this.events.trigger('catch-body', [{body, shape}]);
                        }
                        break;
                    }
                }
            }
        }
    }

    mouseUp (event: QMouseEvent) {
        if (event.mouse.leftButtonPressed) return;
        for (const constraint of this.constraints) {
            constraint.bodyA = undefined;
        }
    }

    mouseMove (event: QMouseEvent) {
        for (const constraint of this.constraints) {
            constraint.pointB.x = event.mouse.position.x;
            constraint.pointB.y = event.mouse.position.y;
        }
    }

}