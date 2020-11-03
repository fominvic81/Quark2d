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

        this.mouse.events.on('mousedown', (event) => {this.mouseDown(event)});
        this.mouse.events.on('mouseup', (event) => {this.mouseUp(event)});
        this.mouse.events.on('mousemove', (event) => {this.mouseMove(event)});

    }

    mouseDown (event) {
        if (!this.mouse.leftButtonPressed) return;
        if (this.constraint) {

            const bodies = this.engine.world.allBodies();

            for (const body of bodies) {
                if (body.isStatic) continue;
                if (body.getBounds().contains(event.position)) {
                    for (const shape of body.shapes) {
                        if (shape.getBounds().contains(event.position)) {
                            
                            if (shape.type === Shape.AAB) {
                                this.constraint.bodyA = body;
                                Vector.rotate(Vector.subtract(event.position, body.position, this.constraint.pointA), -body.angle);
                                this.events.trigger('catchBody', [{body, shape}]);
                                break;
                            }

                            if (shape.type === Shape.CIRCLE) {
                                if (Vector.lengthSquared(Vector.subtract(event.position, shape.getWorldPosition(), Vector.temp[0])) < Math.pow(shape.radius, 2)) {
                                    this.constraint.bodyA = body;
                                    Vector.rotate(Vector.subtract(event.position, body.position, this.constraint.pointA), -body.angle);
                                    this.events.trigger('catchBody', [{body, shape}]);
                                    break;
                                }
                            }

                            if (shape.type === Shape.CONVEX) {
                                if (Vertices.contains(shape.getWorldVertices(), event.position)) {
                                    this.constraint.bodyA = body;
                                    Vector.rotate(Vector.subtract(event.position, body.position, this.constraint.pointA), -body.angle);
                                    this.events.trigger('catchBody', [{body, shape}]);
                                    break;
                                }
                            }
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