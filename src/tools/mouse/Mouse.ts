import { Events } from '../../common/Events';
import { Vector } from '../../math/Vector';
import { Render } from '../render/Render';

export interface QMouseEvent {
    mouse: Mouse;
    event: any;
}

export class Mouse {
    render: Render;
    events: Events = new Events();
    pressed: boolean = false;
    leftButtonPressed : boolean = false;
    rightButtonPressed: boolean = false;
    wheelButtonPressed: boolean = false;
    localPosition: Vector = new Vector();
    position: Vector = new Vector();
    localMovement: Vector = new Vector();
    movement: Vector = new Vector();
    scroll: Vector = new Vector();

    constructor (render: Render) {

        this.render = render;

        this.render.canvas.addEventListener('mousedown', (event) => {
            this.mouseDown(event);
        });

        this.render.canvas.addEventListener('mouseup', (event) => {
            this.mouseUp(event);
        });

        this.render.canvas.addEventListener('mousemove', (event) => {
            this.mouseMove(event);
        });

        this.render.canvas.addEventListener('wheel', (event) => {
            this.mouseWheel(event);
        });

    }

    mouseDown (event: MouseEvent) {
        this.pressed = true;

        if (event.button === 0) {
            this.leftButtonPressed = true;
        } else if (event.button === 1) {
            this.wheelButtonPressed = true;
        } else if (event.button === 2) {
            this.rightButtonPressed = true;
        }

        this.localPosition.set(event.offsetX, event.offsetY);
        this.updatePosition();
        
        this.events.trigger('mouse-down', [{mouse: this, event}]);

    }
    
    mouseUp (event: MouseEvent) {
        if (event.buttons <= 0) {
            this.pressed = false;
        }

        if (event.button === 0) {
            this.leftButtonPressed = false;
        } else if (event.button === 1) {
            this.wheelButtonPressed = false;
        } else if (event.button === 2) {
            this.rightButtonPressed = false;
        }

        this.localPosition.set(event.offsetX, event.offsetY);
        this.updatePosition();

        this.events.trigger('mouse-up', [{mouse: this, event}]);
    }

    mouseMove (event: MouseEvent) {
        this.localPosition.set(event.offsetX, event.offsetY);
        this.updatePosition();

        this.localMovement.set(event.movementX, event.movementY);
        this.updateMovement();

        this.events.trigger('mouse-move', [{mouse: this, event}]);
    }

    mouseWheel (event: MouseEvent) {
        this.events.trigger('wheel', [{mouse: this, event}]);
    }

    updatePosition () {
        this.position.set(
            (this.localPosition.x - this.render.canvas.width / 2) / this.render.options.scale.x - this.render.options.translate.x,
            (this.localPosition.y - this.render.canvas.height / 2) / this.render.options.scale.y - this.render.options.translate.y
        );
    }

    updateMovement () {
        this.movement.set(
            this.localMovement.x / this.render.options.scale.x,
            this.localMovement.y / this.render.options.scale.y,
        );
    }

}