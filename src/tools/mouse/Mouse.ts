import { Events } from '../../common/Events';
import { Vector } from '../../math/Vector';
import { Render } from '../render/Render';

export interface QMouseEvent {
    mouse: Mouse;
    event: MouseEvent;
}
export interface QWheelEvent {
    mouse: Mouse;
    event: WheelEvent;
}

type MouseEventMap = {
    'mouse-down': (data: QMouseEvent) => void;
    'mouse-up': (data: QMouseEvent) => void;
    'mouse-move': (data: QMouseEvent) => void;
    'wheel': (data: QWheelEvent) => void;
}

export class Mouse extends Events<MouseEventMap> {
    render: Render;
    pressed: boolean = false;
    leftButtonPressed : boolean = false;
    rightButtonPressed: boolean = false;
    wheelButtonPressed: boolean = false;
    localPosition: Vector = new Vector();
    position: Vector = new Vector();
    localMovement: Vector = new Vector();
    movement: Vector = new Vector();
    scroll: Vector = new Vector();
    mousedownListener = (event: MouseEvent) => this.mouseDown(event);
    mouseupListener = (event: MouseEvent) => this.mouseUp(event);
    mousemoveListener = (event: MouseEvent) => this.mouseMove(event);
    wheelListener = (event: WheelEvent) => this.mouseWheel(event);

    constructor (render: Render) {
        super();

        this.render = render;

        this.render.canvas.addEventListener('mousedown', this.mousedownListener);
        this.render.canvas.addEventListener('mouseup', this.mouseupListener);
        this.render.canvas.addEventListener('mousemove', this.mousemoveListener);
        this.render.canvas.addEventListener('wheel', this.wheelListener);
    }

    removeListeners () {
        this.render.canvas.removeEventListener('mousedown', this.mousedownListener);
        this.render.canvas.removeEventListener('mouseup', this.mouseupListener);
        this.render.canvas.removeEventListener('mousemove', this.mousemoveListener);
        this.render.canvas.removeEventListener('wheel', this.wheelListener);
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
        
        this.trigger('mouse-down', {mouse: this, event});

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

        this.trigger('mouse-up', {mouse: this, event});
    }

    mouseMove (event: MouseEvent) {
        this.localPosition.set(event.offsetX, event.offsetY);
        this.updatePosition();

        this.localMovement.set(event.movementX, event.movementY);
        this.updateMovement();

        this.trigger('mouse-move', {mouse: this, event});
    }

    mouseWheel (event: WheelEvent) {
        this.trigger('wheel', {mouse: this, event});
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