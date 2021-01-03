import { Vector } from '../math/Vector';
import { Bounds } from '../math/Bounds';
import { Common } from '../common/Common';
import { Events } from '../common/Events';
import { Sleeping } from './Sleeping';
import { Shape } from './shapes/Shape';


export class Body {

    constructor (options = {}) {
        this.id = Common.nextId();
        this.name = 'body';
        this.shapes = [];
        this.shapesBounds = [];
        this.bounds = new Bounds();
        this.boundsNeedsUpdate = true;
        this.events = new Events();
        this.positionImpulse = new Vector();
        this.constraintImpulse = new Vector();
        this.constraintImpulse.angle = 0;
        this.contactsCount = 0;
        this.angularAcceleration = 0;
        this.angle = 0;
        this.anglePrev = 0;
        this.angularVelocity = 0;
        this.torque = 0;
        this.position = new Vector();
        this.positionPrev = new Vector();
        this.acceleration = new Vector();
        this.velocity = new Vector();
        this.force = new Vector();
        this.dir = new Vector(Math.cos(this.angle), Math.sin(this.angle));
        this.isStatic = false;
        this.inverseMassMultiplier = new Vector(1, 1);
        this.inverseMassMultiplied = new Vector(this.inverseMass, this.inverseMass);
        this.inverseInertiaMultiplier = 1;
        this.inverseInertiaMultiplied = this.inverseInertia;
        this.velocityDamping = 0.0005;
        this.density = 100;
        this.mass = 0;
        this.inverseMass = 0;
        this.inertia = 0;
        this.inverseInertia = 0;
        this.area = 0;
        this.sleepState = Sleeping.AWAKE;
        this.motion = 0;
        this.sleepyTimer = 0;

        this.set(options);
        
        this.updateArea();
        this.updateMass();
        this.updateInertia();
    }

    set (options) {
        for (const option of Object.entries(options)) {
            switch (option[0]) {
                case 'position':
                    this.setPosition(option[1]);
                    break;
                case 'angle':
                    this.setAngle(option[1]);
                    break;
                case 'mass':
                    this.setMass(option[1]);
                    break;
                case 'density':
                    this.setDensity(option[1]);
                    break;
                case 'isStatic':
                    this.setStatic(option[1]);
                    break;
                case 'velocityDamping':
                    this.velocityDamping = option[1];
                    break;
                case 'fixedRotation':
                    this.setFixedRotation(option[1]);
                    break;
                case 'fixedX':
                    this.setFixedX(option[1]);
                    break;
                case 'fixedY':
                    this.setFixedY(option[1]);
                    break;
            }
        }

    }

    update (delta) {
        if (this.isStatic || this.sleepState === Sleeping.SLEEPING) return;
        // update acceleration
        Vector.mult(this.force, Vector.scale(this.inverseMassMultiplied, delta, Body.vecTemp[0]), this.acceleration);

        // update velocity
        Vector.add(Vector.scale(this.velocity, (1 - this.velocityDamping)), Vector.scale(this.acceleration, delta));
        
        // update position 
        Vector.clone(this.position, this.positionPrev);
        this.translate(this.velocity);

        // update angularAcceleration
        this.angularAcceleration = this.torque * this.inverseInertiaMultiplied * delta;

        // update angularVelocity
        this.angularVelocity = this.angularVelocity * (1 - this.velocityDamping) + this.angularAcceleration * delta;

        // update angle
        this.anglePrev = this.angle;
        this.rotate(this.angularVelocity);

        // clear forces
        Vector.set(this.force, 0, 0);
        this.torque = 0;

        this.boundsNeedsUpdate = true;
    }

    addShape (shape, updateCenterOfMass = false, offset = new Vector(), angle = 0) {

        shape.rotate(this.angle + angle);
        shape.translate(this.position);
        shape.translate(offset);

        shape.body = this;

        this.shapes.push(shape);

        this.updateArea();

        if (updateCenterOfMass) {
            this.updateCenterOfMass();
        }

        this.updateMass();
        this.updateInertia();
        
        this.boundsNeedsUpdate = true;

        this.events.trigger('add-shape', [{shape, updateCenterOfMass, offset, angle, body: this}])
    }

    updateArea () {
        
        this.area = 0;
        
        for (const shape of this.shapes) {
            this.area += shape.area;
        }
        
    }

    updateInertia () {
        let inertia = 0;
    
        if (this.isStatic) {
            this.inertia = 0;
            this.inverseInertia = 0;
        } else {
            for(const shape of this.shapes) {
                // now this code is wrong
                const shapeInertia = shape.inertia;
                inertia += shapeInertia;
            }
        }
        
        
        this.inertia = this.mass * inertia;
        this.inverseInertia = this.inertia === 0 ? 0 : 1 / this.inertia;
        this.inverseInertiaMultiplied = this.inverseInertiaMultiplier * this.inverseInertia;
    }
    
    updateMass () {

        if (this.isStatic) {
            this.mass = 0;
            this.inverseMass = 0;
        } else {
            this.mass = this.area * this.density;
            this.inverseMass = this.mass === 0 ? 0 : (1 / this.mass);
        }

        Vector.scale(this.inverseMassMultiplier, this.inverseMass, this.inverseMassMultiplied);
    }

    updateBounds () {
        if (this.boundsNeedsUpdate) {
            this.shapesBounds.length = 0;

            for (const shape of this.shapes) {
                this.shapesBounds.push(shape.updateBounds());
            }
            Bounds.combine(this.shapesBounds, this.bounds);
            this.boundsNeedsUpdate = false;
        }
    }

    updateCenterOfMass () {
        const sum = Vector.temp[0];
        const offset = Vector.temp[1];
        Vector.set(sum, 0, 0);
    
        for (const shape of this.shapes){
            Vector.subtract(this.position, shape.worldPosition, offset);
            Vector.add(sum, Vector.scale(offset, shape.area, Vector.temp[2]));
        }
    
        const cm = Vector.scale(sum, 1 / this.area, Vector.temp[1]);

        Vector.subtract(this.position, cm);
    }

    setPosition (position) {
        this.translate(Vector.subtract(position, this.position, Body.vecTemp[0]));
    }

    translate (offset) {
        Vector.add(this.position, offset);

        for (const shape of this.shapes) {
            shape.translate(offset);
        }

        this.boundsNeedsUpdate = true;
    }

    setAngle (angle) {
        this.rotate(angle - this.angle);
    }

    rotate (angle) {
        this.angle += angle;

        const cos = Math.cos(angle);
        const sin = Math.sin(angle);

        let vertices;
        let dx = this.dir.x;
        let dy = this.dir.y;
        let normals;

        this.dir.x = dx * cos - dy * sin;
        this.dir.y = dx * sin + dy * cos;

        for (const shape of this.shapes) {

            dx = shape.worldPosition.x - this.position.x;
            dy = shape.worldPosition.y - this.position.y;

            shape.worldPosition.x = dx * cos - dy * sin + this.position.x;
            shape.worldPosition.y = dx * sin + dy * cos + this.position.y;

            if (shape.type === Shape.CONVEX) {
                vertices = shape.worldVertices;

                for (const vertex of vertices) {
                    dx = vertex.x - this.position.x;
                    dy = vertex.y - this.position.y;
        
                    vertex.x = dx * cos - dy * sin + this.position.x;
                    vertex.y = dx * sin + dy * cos + this.position.y;
                }

                normals = shape.worldNormals;

                for (const normal of normals) {
                    dx = normal.x;
                    dy = normal.y;
        
                    normal.x = dx * cos - dy * sin;
                    normal.y = dx * sin + dy * cos;
                }

                normals = shape.allWorldNormals;

                for (const normal of normals) {
                    dx = normal.x;
                    dy = normal.y;
        
                    normal.x = dx * cos - dy * sin;
                    normal.y = dx * sin + dy * cos;
                }
            }
        }

        this.boundsNeedsUpdate = true;
    }

    setMass (mass) {
        this.density = this.area === 0 ? 0 : mass / this.area;
        this.updateMass();
        this.updateInertia();
    }

    setDensity (density) {
        this.density = density;
        this.updateMass();
        this.updateInertia();
    }

    getBounds () {
        this.updateBounds();
        return this.bounds;
    }

    setStatic (value) {
        this.isStatic = value;
        if (value) {
            Vector.set(this.acceleration, 0, 0);
            Vector.set(this.velocity, 0, 0);
            Vector.set(this.force, 0, 0);
            this.angularAcceleration = 0;
            this.angularVelocity = 0;
            this.torque = 0;
            Vector.set(this.positionImpulse, 0, 0);
        }
        this.updateMass();
        this.updateInertia();
    }

    setSleeping (value) {
        this.sleepState = value;

        if (this.sleepState === Sleeping.SLEEPING) {
            this.sleepyTimer = Sleeping.sleepyTimeLimit;

            Vector.set(this.positionImpulse, 0, 0);
            Vector.set(this.velocity, 0, 0);

            this.angularVelocity = 0;

            this.motion = 0;
        } else if (this.sleepState === Sleeping.AWAKE) {
            this.sleepyTimer = 0;
        }

    }

    applyForce (force, offset = undefined) {
        Vector.add(this.force, force);
        if (offset) {
            this.torque += Vector.cross(offset, force);
        }
    }

    applyImpulse (impusle, offset = undefined, move = false) {
        const velocity = Vector.mult(impusle, this.inverseMassMultiplied, Body.vecTemp[0]);
        Vector.add(this.velocity, velocity);

        if (move) {
            Vector.add(this.position, velocity);
        }
        if (offset) {
            const angularVelocity = Vector.cross(offset, impusle) * this.inverseInertiaMultiplied;
            this.angularVelocity += angularVelocity;
            if (move) {
                this.angle += angularVelocity;
            }
        }
    }

    setVelocity (velocity) {
        Vector.clone(velocity, this.velocity);
    }

    setFixedRotation (value) {
        this.inverseInertiaMultiplier = value ? 0 : 1;
        this.updateInertia();
    }

    setFixedX (value) {
        this.inverseMassMultiplier.x = value ? 0 : 1;
        this.updateMass();
    }

    setFixedY (value) {
        this.inverseMassMultiplier.y = value ? 0 : 1;
        this.updateMass();
    }

}

Body.vecTemp = [
    new Vector(),
];