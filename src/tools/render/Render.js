import { Vector } from '../../math/Vector';
import { Draw } from './Draw';
import { Shape } from '../../body/shapes/Shape';
import { Events } from '../../common/Events';
import { Mouse } from '../mouse/Mouse';
import { Sleeping } from '../../body/Sleeping';
import { Equation } from '../../constraint/equation/Equation';
import { Bounds } from '../../math/Bounds';
import { Solver } from '../../collision/solver/Solver';

export class Render {

    constructor (engine, options = {}) {

        this.engine = engine;
        this.events = new Events();

        this.options = {
            scale: new Vector(20, 20),
            translate: new Vector(),
            bounds: new Bounds(),
            lineWidth: 1,
            backgroundColor: options.backgroundColor || 'rgb(48, 48, 48)',
            showBodies: options.showBodies !== undefined ? options.showBodies : true,
            showConstraints: options.showConstraints !== undefined ? options.showConstraints : true,
            showAngleIndicator: options.showAngleIndicator !== undefined ? options.showAngleIndicator : true,
            showSleeping: options.showSleeping !== undefined ? options.showSleeping : true,
            showRadius: options.showRadius !== undefined ? options.showRadius : true,
            showCollisions: options.showCollisions !== undefined ? options.showCollisions : false,
            showNormals: options.showNormals !== undefined ? options.showNormals : false,
            showBounds: options.showBounds !== undefined ? options.showBounds : false,
            showPositionImpulses: options.showPositionImpulses !== undefined ? options.showPositionImpulses : false,
            showVelocity: options.showVelocity !== undefined ? options.showVelocity : false,
            showAngularVelocity: options.showAngularVelocity !== undefined ? options.showAngularVelocity: false,
            showBroadphaseGrid: options.showBroadphaseGrid !== undefined ? options.showBroadphaseGrid: false,
            showPositions: options.showPositions !== undefined ? options.showPositions : false,
            showConstraintBounds: options.showConstraintBounds !== undefined ? options.showConstraintBounds : false,
            showVertexIds: options.showVertexIds !== undefined ? options.showVertexIds : false,

            showStatus: options.showStatus !== undefined ? options.showStatus : false,
        }

        this.canvas = options.canvas || this.createCanvas(options.width || 800, options.height || 600);
        this.ctx = this.canvas.getContext('2d');

        this.element = options.element;

        this.statusTimer = 0;
        this.statusText = '';
        
        if (this.element) {
            this.element.appendChild(this.canvas);
        } else {
            console.warn('options.element was undefined, canvas was created but not appended');
        }

        this.mouse = new Mouse(this);

        this.mouse.events.on('mouse-move', (event) => {this.mouseMove(event)});
        this.mouse.events.on('wheel', (event) => {this.mouseWheel(event)});
    }

    step (timestamp) {

        this.statusTimer += timestamp.delta;
        this.events.trigger('before-step', [{render: this, timestamp}]);

        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.fillStyle = this.options.backgroundColor;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.ctx.translate(
            this.canvas.width / 2 + this.options.translate.x * this.options.scale.x,
            this.canvas.height / 2 + this.options.translate.y * this.options.scale.y
        );
        this.ctx.scale(this.options.scale.x, this.options.scale.y);

        this.options.lineWidth = 1 / Math.pow(this.options.scale.x + this.options.scale.y, 0.5) * 3;

        this.updateBounds();

        const allBodies = this.engine.world.allBodies();
        const allConstraints = this.engine.world.allConstraints();

        const bodies = [];

        for (const body of allBodies) {
            if (this.options.bounds.overlaps(body.getBounds())) {
                bodies.push(body);
            }
        }

        if (this.options.showBodies) {
            this.bodies(bodies);
        }
        if (this.options.showConstraints) {
            this.constraints(allConstraints);
        }
        if (this.options.showAngleIndicator) {
            this.angleIndicator(bodies);
        }
        if (this.options.showCollisions) {
            this.collisions();
        }
        if (this.options.showNormals) {
            this.normals(bodies);
        }
        if (this.options.showBounds) {
            this.bounds(bodies);
        }
        if (this.options.showPositionImpulses) {
            this.positionImpulses(bodies);
        }
        if (this.options.showVelocity) {
            this.velocity(bodies);
        }
        if (this.options.showAngularVelocity) {
            this.angularVelocity(bodies);
        }
        if (this.options.showBroadphaseGrid) {
            this.grid();
        }
        if (this.options.showPositions) {
            this.positions(bodies);
        }
        if (this.options.showVertexIds) {
            this.vertexIds(bodies);
        }
        
        this.events.trigger('after-step', [{render: this, timestamp}]);
        
        this.ctx.setTransform(1, 0, 0, 1, 0, 0);

        if (this.options.showStatus) {
            this.status();
        }
    }

    updateBounds () {
        this.options.bounds.min.x = (-this.canvas.width / 2) / this.options.scale.x - this.options.translate.x;
        this.options.bounds.max.x = (this.canvas.width / 2) / this.options.scale.x - this.options.translate.x;

        this.options.bounds.min.y = (-this.canvas.height / 2) / this.options.scale.y - this.options.translate.y;
        this.options.bounds.max.y = (this.canvas.height / 2) / this.options.scale.y - this.options.translate.y;
    }

    bodies (bodies) {

        for (const body of bodies) {
            const color = (body.sleepState === Sleeping.AWAKE || !this.options.showSleeping) ? 'rgb(200, 200, 200)' : 'rgb(100, 100, 100)';
            for (const shape of body.shapes) {
                const pos = shape.getWorldPosition();
                if (shape.type === Shape.CIRCLE) {
                    Draw.circle(this.ctx, pos, Math.max(shape.radius - Solver.SLOP / 2, 0.00001), color, false, this.options.lineWidth / 20);
                } else if (shape.type === Shape.CONVEX) {
                    if (this.options.showRadius) {
                        this.convex(shape, color, false, this.options.lineWoidth / 20);
                    } else {
                        Draw.polygon(this.ctx, shape.getWorldVertices(), color, false, this.options.lineWidth / 20);
                    }
                }
            }
        }
    }

    constraints (constraints) {

        for (const constraint of constraints) {
            const start = constraint.getWorldPointA();
            const end = constraint.getWorldPointB();
            
            for (const equation of constraint.equations) {
                switch (equation.type) {
                    case Equation.DISTANCE_EQUATION:

                        if (this.options.showConstraintBounds) {
                            if (equation.length && equation.length > 0.01) {
                                if (!constraint.bodyA) Draw.circle(this.ctx, start, equation.length, 'rgb(100, 200, 100)', false, this.options.lineWidth / 20);
                                if (!constraint.bodyB) Draw.circle(this.ctx, end, equation.length, 'rgb(100, 200, 100)', false, this.options.lineWidth / 20);
                            }
                            if (equation.minLength && equation.minLength > 0.01) {
                                if (!constraint.bodyA) Draw.circle(this.ctx, start, equation.minLength, 'rgb(100, 200, 100)', false, this.options.lineWidth / 20);
                                if (!constraint.bodyB) Draw.circle(this.ctx, end, equation.minLength, 'rgb(100, 200, 100)', false, this.options.lineWidth / 20);
                            }
                        }

                        if (equation.length <= 1 || equation.stiffness > 0.8) {
                            Draw.line(this.ctx, start, end, 'rgb(128, 128, 128)', this.options.lineWidth / 20);
                        } else {
                            const n = Vector.subtract(end, start, Vector.temp[0]);
                            const len = Vector.length(n);

                            const normal = Vector.rotate90(Vector.divide(n, len, Vector.temp[1]));
                            const count = Math.max(equation.length * 2, 4);

                            this.ctx.beginPath();
                            this.ctx.moveTo(start.x, start.y);

                            for (let i = 1; i < count; ++i) {
                                const side = i % 2 === 0 ? 1 : -1;
                                const offset = Vector.scale(normal, side * 0.25, Vector.temp[2]);
                                const p = i / count;

                                this.ctx.lineTo(
                                    start.x + n.x * p + offset.x,
                                    start.y + n.y * p + offset.y,
                                );

                            }

                            this.ctx.lineTo(end.x, end.y);

                            this.ctx.strokeStyle = 'rgb(128, 128, 128)';
                            this.ctx.lineWidth = this.options.lineWidth / 20;
                            this.ctx.stroke();
                        }
                        break;
                    case Equation.ANGLE_EQUATION:
                        this.ctx.moveTo(start.x, start.y);
                        if (constraint.bodyA) {
                            this.ctx.arc(start.x, start.y, 0.4, equation.minAngleA + constraint.bodyA.angle + Math.PI, equation.maxAngleA + constraint.bodyA.angle + Math.PI, true);
                        } else {
                            this.ctx.arc(start.x, start.y, 0.4, equation.minAngleA + Math.PI, equation.maxAngleA + Math.PI, true);
                        }
                        this.ctx.lineTo(start.x, start.y);

                        
                        this.ctx.moveTo(end.x, end.y);
                        if (constraint.bodyB) {
                            this.ctx.arc(end.x, end.y, 0.4, equation.minAngleB + constraint.bodyB.angle, equation.maxAngleB + constraint.bodyB.angle, true);
                        } else {
                            this.ctx.arc(end.x, end.y, 0.4, equation.minAngleB, equation.maxAngleB, true);
                        }
                        this.ctx.lineTo(end.x, end.y);


                        this.ctx.strokeStyle = 'rgb(200, 200, 200)';
                        this.ctx.lineWidth = this.options.lineWidth / 20;
                        this.ctx.stroke();
                        break
                }
            }

            Draw.circle(this.ctx, start, this.options.lineWidth / 10, 'rgb(100, 100, 100)');
            Draw.circle(this.ctx, end, this.options.lineWidth / 10, 'rgb(100, 100, 100)');
        }

    }

    angleIndicator (bodies) {
        for (const body of bodies) {
            for (const shape of body.shapes) {
                const pos = shape.getWorldPosition();
                const angle = shape.getWorldAngle();

                if (shape.type === Shape.CIRCLE) {
                    Draw.line(this.ctx, pos, Vector.add(Vector.set(
                        Vector.temp[0],
                        Math.cos(angle) * shape.radius,
                        Math.sin(angle) * shape.radius,
                    ), pos), 'rgb(200, 200, 200)', this.options.lineWidth / 10);
                } else if (shape.type === Shape.CONVEX) {
                    const vertices = shape.getWorldVertices();
                    Draw.line(this.ctx, pos, Vector.set(
                        Vector.temp[0],
                        (vertices[0].x + vertices[1].x) / 2,
                        (vertices[0].y + vertices[1].y) / 2,
                    ), 'rgb(200, 200, 200)', this.options.lineWidth / 10);
                }

            }
        }
    }

    collisions () {
        const pairs = this.engine.narrowphase.pairs;

        for (const pair of pairs.values()) {
            if (!pair.isActive) continue;

            for (const shapePair of pair.shapePairs.values()) {
                if (!shapePair.isActive) continue;
                for (let i = 0; i < shapePair.contactsCount; ++i) {
                    const contact = shapePair.contacts[i];
                    Draw.circle(this.ctx, contact.vertex, this.options.lineWidth / 8,'rgb(200, 80, 80)');
                    Draw.line(this.ctx, contact.vertex, Vector.add(Vector.scale(shapePair.normal, 0.2, Vector.temp[0]), contact.vertex), 'rgb(200, 80, 80)', this.options.lineWidth / 8);
                }
            }
        }
    }

    normals (bodies) {
        for (const body of bodies) {
            for (const shape of body.shapes) {
                if (shape.type === Shape.CONVEX) {
                    const pos = shape.getWorldPosition();
                    const normals = shape.getWorldNormals(true);
                    for (const normal of normals) {
                        Draw.line(this.ctx, pos, Vector.add(pos, normal, Vector.temp[0]), 'rgb(200, 100, 100)', this.options.lineWidth / 8);
                    }
                }
            }
        }
    }

    bounds (bodies) {
        for (const body of bodies) {
            const bounds = body.getBounds();
            const width = bounds.max.x - bounds.min.x;
            const height = bounds.max.y - bounds.min.y;
            Draw.rect(this.ctx, Vector.set(Vector.temp[0], bounds.min.x + width / 2, bounds.min.y + height / 2), width, height, 0, 'rgb(96, 96, 96)', false, this.options.lineWidth / 25);

            for (const shape of body.shapes) {
                const shapeBounds = shape.getBounds();
                const shapeWidth = shapeBounds.max.x - shapeBounds.min.x;
                const shapeHeight = shapeBounds.max.y - shapeBounds.min.y;
                Draw.rect(this.ctx, Vector.set(Vector.temp[0], shapeBounds.min.x + shapeWidth / 2, shapeBounds.min.y + shapeHeight / 2), shapeWidth, shapeHeight, 0, 'rgb(96, 96, 96)', false, this.options.lineWidth / 50);
            }
        }
    }

    positionImpulses (bodies) {
        for (const body of bodies) {
            Draw.line(this.ctx, body.position, Vector.add(body.position, body.positionImpulse, Vector.temp[0]), 'rgb(80, 80, 200)', this.options.lineWidth / 10);
        }
    }

    velocity (bodies) {
        for (const body of bodies) {
            Draw.line(this.ctx, body.position, Vector.add(body.position, Vector.scale(body.velocity, 5, Vector.temp[0]), Vector.temp[0]), 'rgb(80, 200, 80)', this.options.lineWidth / 10);
        }
    }

    angularVelocity (bodies) {
        for (const body of bodies) {
            Draw.circle(this.ctx, body.position, Math.abs(body.angularVelocity) * 5, 'rgb(80, 200, 80)', false, this.options.lineWidth / 20);
        }
    }

    grid () {
        const broadphase = this.engine.broadphase;
        const grid = broadphase.grid;

        for (const position of grid.keys()) {
            const cell = grid.get(position);
            Vector.add(position, Vector.set(Vector.temp[0], 0.5, 0.5))
            Draw.rect(this.ctx, Vector.scale(position, broadphase.gridSize), broadphase.gridSize, broadphase.gridSize, 0, 'rgb(80, 200, 80)', false, this.options.lineWidth / 50);
        }
    }

    positions (bodies) {
        for (const body of bodies) {
            Draw.circle(this.ctx, body.position, this.options.lineWidth / 4 , 'rgb(40, 160, 40)');
            for (const shape of body.shapes) {
                Draw.circle(this.ctx, shape.getWorldPosition(), this.options.lineWidth / 8 , 'rgb(160, 40, 40)');
            }
        }
    }

    vertexIds (bodies) {
        for (const body of bodies) {
            for (const shape of body.shapes) {
                if (shape.type === Shape.CONVEX) {
                    const vertices = shape.getWorldVertices();
                    for (const vertex of vertices) {
                        this.ctx.font = '0.5px Arial';
                        this.ctx.fillStyle = 'rgb(128, 128, 128)';
                        this.ctx.fillText(vertex.index, vertex.x, vertex.y);
                    }
                }
            }
        }
    }

    status () {


        if (this.statusTimer >= 0.1) {
            this.statusTimer -= 0.1;
            this.statusText = '';

            if (this.engine.timestamp) {
                this.statusText += `tps: ${Math.round(this.engine.timestamp.tps)}   `;
            }

            const allBodies = this.engine.world.allBodies();

            this.statusText += `bodies: ${allBodies.length}   `

            const allConstraints = this.engine.world.allConstraints();

            this.statusText += `constraints: ${allConstraints.length}   `

            this.statusText += `broadphasePairs: ${this.engine.broadphase.activePairsCount}   `;
            this.statusText += `midphasePairs: ${this.engine.midphase.activePairsCount}   `;
            this.statusText += `narrowphasePairs: ${this.engine.narrowphase.activePairsCount}   `;

            this.statusText += `positionIterations: ${this.engine.solver.positionIterations}   `;
            this.statusText += `velocityIterations: ${this.engine.solver.velocityIterations}   `;
            this.statusText += `constraintIterations: ${this.engine.solver.constraintIterations}   `;
        }

        this.ctx.font = '12px Arial';

        this.ctx.fillStyle = 'rgb(128, 128, 128)';
        this.ctx.fillText(this.statusText, 20, 20, this.canvas.width - 50);

    }

    scale (scale) {
        Vector.add(this.options.scale, scale);
    }

    setScale (scale) {
        Vector.clone(scale, this.options.scale);
    }

    translate (translate) {
        Vector.add(this.options.translate, translate);
    }

    setTranslate (translate) {
        Vector.clone(translate, this.options.translate);
    }

    mouseMove (event) {
        if (this.mouse.rightButtonPressed) {
            Vector.add(this.options.translate, event.movement);
        }
    }

    mouseWheel (event) {
        this.options.scale.x -= event.deltaY * this.options.scale.x / 2500;
        this.options.scale.y -= event.deltaY * this.options.scale.y / 2500;
    }

    createCanvas (width, height) {
        const canvas = document.createElement('canvas');
        canvas.style.position = 'fixed';
        canvas.style.left = 0;
        canvas.style.top = 0;
        canvas.style.right = 0;
        canvas.style.bottom = 0;
        canvas.width = width;
        canvas.height = height;
        canvas.oncontextmenu = () => {
            return false;
        }
        return canvas;
    }

    static createCanvas (width, height) {
        const canvas = document.createElement('canvas');
        canvas.style.position = 'fixed';
        canvas.style.left = 0;
        canvas.style.top = 0;
        canvas.style.right = 0;
        canvas.style.bottom = 0;
        canvas.width = width;
        canvas.height = height;
        canvas.oncontextmenu = function() { return false; };
        return canvas;
    }

    convex (convex, color, fill = true, lineWidth = 1) {

        const radius = convex.radius - Solver.SLOP / 2;
        const vertices = convex.getWorldVertices();
        if (radius <= 0.000001) {
            Draw.polygon(this.ctx, vertices, color, fill, lineWidth);
            return;
        }
        
        const normals = convex.getWorldNormals(false);
    
        const first = Vector.add(vertices[0], Vector.scale(normals[vertices.length - 1], radius, Vector.temp[0]), Vector.temp[0]);

        this.ctx.beginPath();
    
        this.ctx.moveTo(first.x, first.y);

        let prevOffset = Vector.scale(normals[vertices.length - 1], radius, Vector.temp[0]);

        for (let i = 0; i < vertices.length; ++i) {
            const offset = Vector.scale(normals[i], radius, Vector.temp[1]);

            const p1 = Vector.add(vertices[i], prevOffset, Vector.temp[2]);

            this.ctx.lineTo(p1.x, p1.y);

            const angle1 = Math.atan2(prevOffset.y, prevOffset.x);
            const angle2 = Math.atan2(offset.y, offset.x);
            
            this.ctx.arc(vertices[i].x, vertices[i].y, radius, angle1, angle2);
            Vector.clone(offset, prevOffset);
        }

        this.ctx.closePath();

        if (fill) {
            this.ctx.fillStyle = color;
            this.ctx.fill();
        } else {
            this.ctx.lineWidth = lineWidth;
            this.ctx.strokeStyle = color;
            this.ctx.stroke();
        }
    }

}