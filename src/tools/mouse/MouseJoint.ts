import { Events } from '../../common/Events';
import { DistJoint } from '../../joint/DistJoint';
import { Engine } from '../../engine/Engine';
import { Mouse, QMouseEvent } from './Mouse';
import { Body, BodyType } from '../../body/Body';
import { Shape } from '../../body/shapes/Shape';

export class MouseJoint extends Events {
    engine: Engine;
    mouse: Mouse;
    joint: DistJoint
    body?: Body;
    shape?: Shape;
    
    constructor (engine: Engine, mouse: Mouse, joint: DistJoint = new DistJoint({stiffness: 0.2, length: 0})) {
        super();

        this.engine = engine;
        this.mouse = mouse;
        this.joint = joint;
        engine.world.addJoint(joint);

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
            this.joint.setBodyA(body);
            this.joint.setWorldPointA(event.mouse.position);
            this.joint.setWorldPointB(event.mouse.position);
            console.log(this.joint)
            this.trigger('catch-body', [{body, shape}]);
            break;
        }
    }

    mouseUp (event: QMouseEvent) {
        if (event.mouse.leftButtonPressed) return;
        if (this.body && this.shape) {
            this.joint.setBodyA();
            this.trigger('throw-body', [{body: this.body, shape: this.shape}]);
            this.body = undefined;
            this.shape = undefined;
        }
    }

    mouseMove (event: QMouseEvent) {
        this.joint.setWorldPointB(event.mouse.position);
    }

}