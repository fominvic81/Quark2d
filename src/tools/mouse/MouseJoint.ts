import { Events } from '../../common/Events';
import { Vector } from '../../math/Vector';
import { DistJoint } from '../../joint/DistJoint';
import { Engine } from '../../engine/Engine';
import { Mouse, QMouseEvent } from './Mouse';
import { Joint } from '../../joint/Joint';
import { Body, BodyType } from '../../body/Body';
import { Shape } from '../../body/shapes/Shape';

export class MouseJoint extends Events {
    engine: Engine;
    mouse: Mouse;
    joints: Joint[];
    body?: Body;
    shape?: Shape;
    
    constructor (engine: Engine, mouse: Mouse, joints: Joint[] = [new DistJoint({stiffness: 0.2, length: 0})]) {
        super();

        this.engine = engine;
        this.mouse = mouse;
        this.joints = joints;

        engine.world.addJoint(...this.joints);

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
            for (const joint of this.joints) {
                joint.impulse = 0;
                joint.pointB.x = event.mouse.position.x;
                joint.pointB.y = event.mouse.position.y;
                joint.setBodyA(body);
                Vector.subtract(event.mouse.position, body.center, joint.pointA).rotate(-body.angle);
                this.trigger('catch-body', [{body, shape}]);
            }
            break;
        }
    }

    mouseUp (event: QMouseEvent) {
        if (event.mouse.leftButtonPressed) return;
        if (this.body && this.shape) {
            for (const joint of this.joints) {
                joint.setBodyA();
            }
            this.trigger('throw-body', [{body: this.body, shape: this.shape}]);
            this.body = undefined;
            this.shape = undefined;
        }
    }

    mouseMove (event: QMouseEvent) {
        for (const joint of this.joints) {
            joint.pointB.x = event.mouse.position.x;
            joint.pointB.y = event.mouse.position.y;
        }
    }

}