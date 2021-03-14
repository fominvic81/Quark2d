import { Events } from '../../common/Events';
import { Shape } from '../../body/shapes/Shape';
import { Vector } from '../../math/Vector';
import { Vertices } from '../../math/Vertices';
import { DistanceEquation } from '../../constraint/equation/DistanceEquation';
import { Constraint } from '../../constraint/Constraint';

export class MouseConstraint {
    
    constructor (engine, mouse, equations = [new DistanceEquation({stiffness: 0.2, length: 0})]) {

        this.engine = engine;
        this.mouse = mouse;
        this.constraint = new Constraint();
        this.constraint.addEquation(equations);
        this.events = new Events();

        engine.world.addConstraint(this.constraint);

        this.mouse.events.on('mouse-down', (event) => {this.mouseDown(event)});
        this.mouse.events.on('mouse-up', (event) => {this.mouseUp(event)});
        this.mouse.events.on('mouse-move', (event) => {this.mouseMove(event)});

    }

    mouseDown (event) {
        if (!this.mouse.leftButtonPressed) return;
        if (this.constraint) {

            for (const body of this.engine.world.bodies.values()) {
                if (body.isStatic) continue;
                for (const shape of body.shapes) {
                    if (shape.getBounds().contains(event.position)) {
                        if (shape.contains(event.position)) {
                            this.constraint.bodyA = body;
                            Vector.rotate(Vector.subtract(event.position, body.position, this.constraint.pointA), -body.angle);
                            this.events.trigger('catch-body', [{body, shape}]);
                            break;
                        }
                    }
                }
            }
        }
    }

    mouseUp (event) {
        if (this.mouse.leftButtonPressed) return;
        this.constraint.bodyA = undefined
    }

    mouseMove (event) {
        Vector.clone(event.position, this.constraint.pointB);
    }

}