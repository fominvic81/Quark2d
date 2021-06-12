import { Events } from '../../common/Events';
import { Vector } from '../../math/Vector';
import { DistanceConstraint } from '../../constraint/DistanceConstraint';
import { Engine } from '../../engine/Engine';
import { Mouse, QMouseEvent } from './Mouse';
import { Constraint } from '../../constraint/Constraint';
import { Body, BodyType } from '../../body/Body';
import { Shape } from '../../body/shapes/Shape';

export class MouseConstraint extends Events {
    engine: Engine;
    mouse: Mouse;
    constraints: Constraint[];
    body?: Body;
    shape?: Shape;
    
    constructor (engine: Engine, mouse: Mouse, constraints: Constraint[] = [new DistanceConstraint({stiffness: 0.2, length: 0})]) {
        super();

        this.engine = engine;
        this.mouse = mouse;
        this.constraints = constraints;

        engine.world.addConstraint(...this.constraints);

        this.mouse.on('mouse-down', (event: QMouseEvent) => {this.mouseDown(event)});
        this.mouse.on('mouse-up', (event: QMouseEvent) => {this.mouseUp(event)});
        this.mouse.on('mouse-move', (event: QMouseEvent) => {this.mouseMove(event)});

    }

    mouseDown (event: QMouseEvent) {
        if (!event.mouse.leftButtonPressed) return;
        const shapes = this.engine.pointTest(this.mouse.position);

        for (const shape of shapes) {
            const body = shape.body!;
            if (body.type !== BodyType.dynamic) continue;
            this.body = body;
            this.shape = shape;
            for (const constraint of this.constraints) {
                constraint.pointB.x = event.mouse.position.x;
                constraint.pointB.y = event.mouse.position.y;
                constraint.setBodyA(body);
                Vector.subtract(event.mouse.position, body.center, constraint.pointA).rotate(-body.angle);
                this.trigger('catch-body', [{body, shape}]);
            }
            break;
        }
    }

    mouseUp (event: QMouseEvent) {
        if (event.mouse.leftButtonPressed) return;
        if (this.body && this.shape) {
            this.body.constraintImpulse.set(0, 0);
            for (const constraint of this.constraints) {
                constraint.setBodyA();
            }
            this.trigger('throw-body', [{body: this.body, shape: this.shape}]);
            this.body = undefined;
            this.shape = undefined;
        }
    }

    mouseMove (event: QMouseEvent) {
        for (const constraint of this.constraints) {
            constraint.pointB.x = event.mouse.position.x;
            constraint.pointB.y = event.mouse.position.y;
        }
    }

}