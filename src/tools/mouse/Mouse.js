import { Events } from '../../common/Events';
import { Vector } from '../../math/Vector';


export class Mouse {

    constructor (render) {

        this.render = render;
        this.events = new Events();

        this.pressed = false;
        this.leftButtonPressed = false;
        this.rightButtonPressed = false;
        this.wheelButtonPressed = false;
        this.localPosition = new Vector();
        this.position = new Vector();
        this.localMovement = new Vector();
        this.movement = new Vector();
        this.scroll = new Vector();
        this.holdsBody = false;

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

    mouseDown (event) {
        this.pressed = true;

        if (event.button === 0) {
            this.leftButtonPressed = true;
        } else if (event.button === 1) {
            this.wheelButtonPressed = true;
        } else if (event.button === 2) {
            this.rightButtonPressed = true;
        }

        Vector.set(this.localPosition, event.clientX, event.clientY);
        this.updatePosition();
        
        this.events.trigger('mousedown', [this]);

        
    }
    
    mouseUp (event) {
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

        Vector.set(this.localPosition, event.clientX, event.clientY);
        this.updatePosition();

        this.events.trigger('mouseup', [this]);
    }

    mouseMove (event) {
        Vector.set(this.localPosition, event.clientX, event.clientY);
        this.updatePosition();

        Vector.set(this.localMovement, event.movementX, event.movementY);
        this.updateMovement();

        this.events.trigger('mousemove', [this]);
    }

    mouseWheel (event) {
        this.events.trigger('wheel', [event]);
    }

    updatePosition () {
        Vector.set(
            this.position,
            (this.localPosition.x - this.render.canvas.width / 2) / this.render.options.scale.x - this.render.options.translate.x,
            (this.localPosition.y - this.render.canvas.height / 2) / this.render.options.scale.y - this.render.options.translate.y
        );
    }

    updateMovement () {
        Vector.set(
            this.movement,
            this.localMovement.x / this.render.options.scale.x,
            this.localMovement.y / this.render.options.scale.y,
        );
    }

}