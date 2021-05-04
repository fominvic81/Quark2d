import { Vector } from '../../math/Vector';
import { Draw } from './Draw';
import { ShapeType } from '../../body/shapes/Shape';
import { Events } from '../../common/Events';
import { Mouse, QMouseEvent } from '../mouse/Mouse';
import { SleepingState } from '../../body/Sleeping';
import { AABB } from '../../math/AABB';
import { Solver } from '../../collision/solver/Solver';
import { Constraint, ConstraintType } from '../../constraint/Constraint';
import { Engine } from '../../engine/Engine';
import { Body } from '../../body/Body';
import { Convex } from '../../body/shapes/Convex';
import { Edge } from '../../body/shapes/Edge';
import { DistanceConstraint } from '../../constraint/DistanceConstraint';

interface RenderOptions {
    backgroundColor?: string;
    showBodies?: boolean;
    showConstraints?: boolean;
    showAngleIndicator?: boolean;
    showSleeping?: boolean;
    showRadius?: boolean;
    showCollisions?: boolean;
    showNormals?: boolean;
    showAABBs?: boolean;
    showPositionImpulses?: boolean;
    showVelocity?: boolean;
    showAngularVelocity?: boolean;
    showBroadphaseGrid?: boolean;
    showPositions?: boolean;
    showConstraintBounds?: boolean;
    showVertexIds?: boolean;

    showStatus?: boolean;

    element?: HTMLElement;
    canvas?: HTMLCanvasElement;

    width?: number;
    height?: number;
}

/**
 * The Render is a class, that provides methods of rendering world, based on HTML5 canvas.
 */

export class Render {
    engine: Engine;
    events: Events = new Events();
    options: {
        scale: Vector;
        translate: Vector;
        aabb: AABB;
        lineWidth: number;
        backgroundColor: string;
        showBodies: boolean;
        showConstraints: boolean;
        showAngleIndicator: boolean;
        showSleeping: boolean;
        showRadius: boolean;
        showCollisions: boolean;
        showNormals: boolean;
        showAABBs: boolean;
        showPositionImpulses: boolean;
        showVelocity: boolean;
        showAngularVelocity: boolean;
        showBroadphaseGrid: boolean;
        showPositions: boolean;
        showConstraintBounds: boolean;
        showVertexIds: boolean;

        showStatus: boolean;
    };
    canvas: HTMLCanvasElement;
    ctx: CanvasRenderingContext2D;

    element: HTMLElement;

    statusTimer: number = 0;
    statusText: string = '';

    mouse: Mouse;

    constructor (engine: Engine, options: RenderOptions = {}) {

        this.engine = engine;

        this.options = {
            scale: new Vector(20, 20),
            translate: new Vector(),
            aabb: new AABB(),
            lineWidth: 1,
            backgroundColor: options.backgroundColor ?? 'rgb(48, 48, 48)',
            showBodies: options.showBodies ?? true,
            showConstraints: options.showConstraints ?? true,
            showAngleIndicator: options.showAngleIndicator ?? true,
            showSleeping: options.showSleeping ?? true,
            showRadius: options.showRadius ?? true,
            showCollisions: options.showCollisions ?? false,
            showNormals: options.showNormals ?? false,
            showAABBs: options.showAABBs ?? false,
            showPositionImpulses: options.showPositionImpulses ?? false,
            showVelocity: options.showVelocity ?? false,
            showAngularVelocity: options.showAngularVelocity ?? false,
            showBroadphaseGrid: options.showBroadphaseGrid ?? false,
            showPositions: options.showPositions ?? false,
            showConstraintBounds: options.showConstraintBounds ?? false,
            showVertexIds: options.showVertexIds ?? false,

            showStatus: options.showStatus ?? false,
        }

        this.canvas = options.canvas || this.createCanvas(options.width ?? 800, options.height ?? 600);
        this.ctx = <CanvasRenderingContext2D>this.canvas.getContext('2d');

        this.statusTimer = 0;
        this.statusText = '';

        if (options.element) {
            this.element = options.element;
            this.element.appendChild(this.canvas);
        } else {
            throw new Error('Options.element is undefined');
        }

        this.mouse = new Mouse(this);

        this.mouse.events.on('mouse-move', (event) => {this.mouseMove(event)});
        this.mouse.events.on('wheel', (event) => {this.mouseWheel(event)});
    }

    /**
     * Renders world. Step should be called every time the scene changes.
     * @param timestamp
     */
    step (timestamp: {delta: number}) {

        this.statusTimer += timestamp.delta;
        this.events.trigger('before-step', [{render: this, timestamp}]);

        this.ctx.setTransform(1, 0, 0, 1, 0, 0);

        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.fillStyle = this.options.backgroundColor;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        if (this.options.showStatus) {
            this.status();
        }
        
        this.ctx.translate(
            this.canvas.width / 2 + this.options.translate.x * this.options.scale.x,
            this.canvas.height / 2 + this.options.translate.y * this.options.scale.y
        );
        this.ctx.scale(this.options.scale.x, this.options.scale.y);

        this.options.lineWidth = 1 / Math.pow(this.options.scale.x + this.options.scale.y, 0.5) * 3;

        this.updateAABB();

        const allBodies = this.engine.world.allBodies();
        const allConstraints = this.engine.world.allConstraints();

        const bodies = [];

        for (const body of allBodies) {
            for (const shape of body.shapes) {
                if (this.options.aabb.overlaps(shape.aabb)) {
                    bodies.push(body);
                    break;
                }
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
        if (this.options.showAABBs) {
            this.AABBs(bodies);
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
        
    }

    updateAABB () {
        this.options.aabb.minX = (-this.canvas.width / 2) / this.options.scale.x - this.options.translate.x;
        this.options.aabb.maxX = (this.canvas.width / 2) / this.options.scale.x - this.options.translate.x;

        this.options.aabb.minY = (-this.canvas.height / 2) / this.options.scale.y - this.options.translate.y;
        this.options.aabb.maxY = (this.canvas.height / 2) / this.options.scale.y - this.options.translate.y;
    }

    bodies (bodies: Body[]) {

        for (const body of bodies) {
            const color = (body.sleepState === SleepingState.AWAKE || !this.options.showSleeping) ? 'rgb(200, 200, 200)' : 'rgb(100, 100, 100)';
            for (const shape of body.shapes) {
                const pos = shape.position;
                switch (shape.type) {
                    case ShapeType.CIRCLE:
                        Draw.circle(this.ctx, pos, Math.max(shape.radius - Solver.SLOP / 2, 0.00001), color, false, this.options.lineWidth / 20);
                        break;
                    case ShapeType.CONVEX:
                        if (this.options.showRadius) {
                            this.convex(<Convex>shape, color, false, this.options.lineWidth / 20);
                        } else {
                            Draw.polygon(this.ctx, (<Convex>shape).vertices, color, false, this.options.lineWidth / 20);
                        }
                        break;
                        case ShapeType.EDGE:
                            if (this.options.showRadius) {
                                this.edge(<Edge>shape, color, this.options.lineWidth / 25);
                            } else {
                                Draw.line(this.ctx, (<Edge>shape).start, (<Edge>shape).end, color, this.options.lineWidth / 25);
                            }
                        break;
                }
            }
        }
    }

    constraints (constraints: Constraint[]) {

        for (const constraint of constraints) {
            if (!constraint.bodyA && !constraint.bodyB) continue;
            const start = constraint.getWorldPointA();
            const end = constraint.getWorldPointB();

            switch (constraint.type) {
                case ConstraintType.DISTANCE_CONSTRAINT:
                    const distanceConstraint = <DistanceConstraint>constraint;
                    if (this.options.showConstraintBounds) {
                        if (distanceConstraint.length && distanceConstraint.length > 0.01) {
                            if (!constraint.bodyA) Draw.circle(this.ctx, start, distanceConstraint.length, 'rgb(100, 200, 100)', false, this.options.lineWidth / 20);
                            if (!constraint.bodyB) Draw.circle(this.ctx, end, distanceConstraint.length, 'rgb(100, 200, 100)', false, this.options.lineWidth / 20);
                        }
                        if (distanceConstraint.minLength && distanceConstraint.minLength > 0.01) {
                            if (!constraint.bodyA) Draw.circle(this.ctx, start, distanceConstraint.minLength, 'rgb(100, 200, 100)', false, this.options.lineWidth / 20);
                            if (!constraint.bodyB) Draw.circle(this.ctx, end, distanceConstraint.minLength, 'rgb(100, 200, 100)', false, this.options.lineWidth / 20);
                        }
                    }

                    if (distanceConstraint.length <= 1 || distanceConstraint.stiffness > 0.8) {
                        Draw.line(this.ctx, start, end, 'rgb(128, 128, 128)', this.options.lineWidth / 20);
                    } else {
                        const delta = Vector.subtract(end, start, Vector.temp[0]);

                        const normal = distanceConstraint.normal.rotate90(Vector.temp[1]);
                        const count = Math.max(distanceConstraint.length * 2, 4);

                        this.ctx.beginPath();
                        this.ctx.moveTo(start.x, start.y);

                        for (let i = 1; i < count; ++i) {
                            const side = i % 2 === 0 ? 1 : -1;
                            const offset = normal.scale(side * 0.25, Vector.temp[2]);
                            const p = i / count;

                            this.ctx.lineTo(
                                start.x + delta.x * p + offset.x,
                                start.y + delta.y * p + offset.y,
                            );

                        }

                        this.ctx.lineTo(end.x, end.y);

                        this.ctx.strokeStyle = 'rgb(128, 128, 128)';
                        this.ctx.lineWidth = this.options.lineWidth / 20;
                        this.ctx.stroke();
                    }
                    break;
            }

            Draw.circle(this.ctx, start, this.options.lineWidth / 10, 'rgb(100, 100, 100)');
            Draw.circle(this.ctx, end, this.options.lineWidth / 10, 'rgb(100, 100, 100)');
        }

    }

    angleIndicator (bodies: Body[]) {
        for (const body of bodies) {
            for (const shape of body.shapes) {
                const pos = shape.position;
                const angle = shape.body!.angle;

                switch (shape.type) {
                    case ShapeType.CIRCLE:
                        Draw.line(this.ctx, pos, Vector.temp[0].set(
                            Math.cos(angle) * shape.radius,
                            Math.sin(angle) * shape.radius,
                        ).add(pos), 'rgb(200, 200, 200)', this.options.lineWidth / 10);
                        break;
                    case ShapeType.CONVEX:
                        const vertices = (<Convex>shape).vertices;
                        Draw.line(this.ctx, pos, Vector.temp[0].set(
                            (vertices[0].x + vertices[1].x) / 2,
                            (vertices[0].y + vertices[1].y) / 2,
                        ), 'rgb(200, 200, 200)', this.options.lineWidth / 10);
                        break;
                }

            }
        }
    }

    collisions () {
        for (const pair of this.engine.manager.activePairs) {
            for (let i = 0; i < pair.contactsCount; ++i) {
                const contact = pair.contacts[i];
                if (this.options.aabb.contains(contact.vertex)) {
                    Draw.circle(this.ctx, contact.vertex, this.options.lineWidth / 8, 'rgb(200, 80, 80)');
                    Draw.line(this.ctx, contact.vertex, contact.pair.normal.scale(0.2, Vector.temp[0]).add(contact.vertex), 'rgb(200, 80, 80)', this.options.lineWidth / 8);
                }
            }
        }
    }

    normals (bodies: Body[]) {
        for (const body of bodies) {
            for (const shape of body.shapes) {
                if (shape.type === ShapeType.CONVEX) {
                    const pos = shape.position;
                    const normals = (<Convex>shape).normals;
                    for (const normal of normals) {
                        Draw.line(this.ctx, pos, Vector.add(pos, normal, Vector.temp[0]), 'rgb(200, 100, 100)', this.options.lineWidth / 8);
                    }
                }
            }
        }
    }

    AABBs (bodies: Body[]) {
        for (const body of bodies) {
            for (const shape of body.shapes) {
                const shapeAABB = shape.aabb;
                const shapeWidth = shapeAABB.maxX - shapeAABB.minX;
                const shapeHeight = shapeAABB.maxY - shapeAABB.minY;
                Draw.rect(this.ctx, Vector.temp[0].set(shapeAABB.minX + shapeWidth / 2, shapeAABB.minY + shapeHeight / 2), shapeWidth, shapeHeight, 0, 'rgb(96, 96, 96)', false, this.options.lineWidth / 50);
            }
        }
    }

    positionImpulses (bodies: Body[]) {
        for (const body of bodies) {
            Draw.line(this.ctx, body.center, Vector.add(body.center, body.positionImpulse, Vector.temp[0]), 'rgb(80, 80, 200)', this.options.lineWidth / 10);
        }
    }

    velocity (bodies: Body[]) {
        for (const body of bodies) {
            Draw.line(this.ctx, body.center, Vector.add(body.center, body.velocity.scale(5, Vector.temp[0]), Vector.temp[0]), 'rgb(80, 200, 80)', this.options.lineWidth / 10);
        }
    }

    angularVelocity (bodies: Body[]) {
        for (const body of bodies) {
            Draw.circle(this.ctx, body.center, Math.abs(body.angularVelocity) * 5, 'rgb(80, 200, 80)', false, this.options.lineWidth / 20);
        }
    }

    grid () {
        const broadphase = this.engine.manager.broadphase;
        const grid = broadphase.grid;
        const position = Vector.temp[0];
        const offset = Vector.temp[1].set(0.5, 0.5);

        const minX = Math.round(this.options.aabb.minX / broadphase.gridSize - 0.5);
        const minY = Math.round(this.options.aabb.minY / broadphase.gridSize - 0.5);
        const maxX = Math.round(this.options.aabb.maxX / broadphase.gridSize + 0.5);
        const maxY = Math.round(this.options.aabb.maxY / broadphase.gridSize + 0.5);

        if (maxX - minX > 50 || maxY - minY > 50) {
            for (const position of grid.keys()) {
                position.add(offset);
                Draw.rect(this.ctx, position.scale(broadphase.gridSize), broadphase.gridSize, broadphase.gridSize, 0, 'rgb(80, 200, 80)', false, this.options.lineWidth / 50);
            }
        } else {
            for (let i = minX; i < maxX; ++i) {
                for (let j = minY; j < maxY; ++j) {
                    position.set(i, j);
                    if (grid.get(position)) {
                        position.add(offset);
                        Draw.rect(this.ctx, position.scale(broadphase.gridSize), broadphase.gridSize, broadphase.gridSize, 0, 'rgb(80, 200, 80)', false, this.options.lineWidth / 50);
                    }
                }
            }
        }
    }

    positions (bodies: Body[]) {
        for (const body of bodies) {
            Draw.circle(this.ctx, body.center, this.options.lineWidth / 2 , 'rgb(40, 160, 40)');
            Draw.circle(this.ctx, body.position, this.options.lineWidth / 5 , 'rgb(200, 200, 200)');
            for (const shape of body.shapes) {
                Draw.circle(this.ctx, shape.position, this.options.lineWidth / 8 , 'rgb(160, 40, 40)');
            }
        }
    }

    vertexIds (bodies: Body[]) {
        for (const body of bodies) {
            for (const shape of body.shapes) {
                if (shape.type === ShapeType.CONVEX) {
                    const vertices = (<Convex>shape).vertices;
                    for (const vertex of vertices) {
                        this.ctx.font = '0.5px Arial';
                        this.ctx.fillStyle = 'rgb(128, 128, 128)';
                        this.ctx.fillText(`${vertex.index}`, vertex.x, vertex.y);
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
                this.statusText += `tps: ${Math.round(<number>this.engine.timestamp.tps)}   `;
            }

            this.statusText += `bodies: ${this.engine.world.bodies.size}   `

            const allConstraints = this.engine.world.allConstraints();

            this.statusText += `constraints: ${allConstraints.length}   `

            this.statusText += `broadphasePairs: ${this.engine.manager.broadphase.activePairs.size}   `;
            this.statusText += `midphasePairs: ${this.engine.manager.midphase.activePairs.length}   `;
            this.statusText += `narrowphasePairs: ${this.engine.manager.activePairs.length}   `;

            this.statusText += `positionIterations: ${this.engine.solver.options.positionIterations}   `;
            this.statusText += `velocityIterations: ${this.engine.solver.options.velocityIterations}   `;
            this.statusText += `constraintIterations: ${this.engine.solver.options.constraintIterations}   `;
        }

        this.ctx.font = '12px Arial';

        this.ctx.fillStyle = 'rgb(128, 128, 128)';
        this.ctx.fillText(this.statusText, 20, 20, this.canvas.width - 50);

    }

    scale (scale: Vector) {
        this.options.scale.add(scale);
    }

    setScale (scale: Vector) {
        scale.clone(this.options.scale);
    }

    translate (translate: Vector) {
        this.options.translate.add(translate);
    }

    setTranslate (translate: Vector) {
        translate.clone(this.options.translate);
    }

    mouseMove (event: QMouseEvent) {
        if (this.mouse.rightButtonPressed) {
            this.options.translate.add(event.mouse.movement);
        }
    }

    mouseWheel (event: QMouseEvent) {
        this.options.scale.x -= event.event.deltaY * this.options.scale.x / 2500;
        this.options.scale.y -= event.event.deltaY * this.options.scale.y / 2500;
    }

    createCanvas (width: number, height: number) {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        canvas.oncontextmenu = () => false;
        return canvas;
    }

    static createCanvas (width: number, height: number) {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        canvas.oncontextmenu = function() { return false; };
        return canvas;
    }

    convex (convex: Convex, color: string, fill: boolean = true, lineWidth: number = 1) {

        const radius = convex.radius;
        const vertices = convex.vertices;
        if (radius <= Solver.SLOP * 2) {
            Draw.polygon(this.ctx, vertices, color, fill, lineWidth);
            return;
        }
        
        const normals = convex.normals;
    
        const first = Vector.add(vertices[0], normals[vertices.length - 1].scale(radius, Vector.temp[0]), Vector.temp[0]);

        this.ctx.beginPath();
    
        this.ctx.moveTo(first.x, first.y);

        let prevOffset = normals[vertices.length - 1].scale(radius, Vector.temp[0]);

        for (let i = 0; i < vertices.length; ++i) {
            const offset = normals[i].scale(radius, Vector.temp[1]);

            const p1 = Vector.add(vertices[i], prevOffset, Vector.temp[2]);

            this.ctx.lineTo(p1.x, p1.y);

            const angle1 = Math.atan2(prevOffset.y, prevOffset.x);
            const angle2 = Math.atan2(offset.y, offset.x);
            
            this.ctx.arc(vertices[i].x, vertices[i].y, radius, angle1, angle2);
            offset.clone(prevOffset);
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

    edge (edge: Edge, color: string, lineWidth: number = 1) {
        const radius = edge.radius;

        if (radius <= Solver.SLOP * 2) {
            Draw.line(this.ctx, edge.start, edge.end, color, lineWidth);
            return;
        }
        Draw.line(this.ctx, edge.start, edge.end, color, lineWidth);
        
        this.halfEdge(edge, radius, 1);

        this.ctx.lineWidth = lineWidth;
        this.ctx.strokeStyle = color;
        this.ctx.stroke();

        this.halfEdge(edge, radius, -1);

        this.ctx.lineWidth = lineWidth;
        this.ctx.strokeStyle = color;
        this.ctx.stroke();
    }

    halfEdge (edge: Edge, radius: number, dir: number) {

        const p1 = edge.normal.scale(edge.radius, Vector.temp[0]).rotate90().add(edge.start);
        const p2 = edge.normal.scale(-edge.radius, Vector.temp[1]).rotate90().add(edge.end);
        const p3 = edge.normal.scale(edge.radius * dir, Vector.temp[2]).add(edge.end);
        const p4 = edge.normal.scale(edge.radius * dir, Vector.temp[3]).add(p1);
        const p5 = edge.normal.scale(edge.radius * dir, Vector.temp[4]).add(p2);

        // Draw.circle(this.ctx, p1, 0.1, 'rgb(200, 200, 200)', true);
        // Draw.circle(this.ctx, p2, 0.2, 'rgb(200, 200, 200)', true);
        // Draw.circle(this.ctx, p3, 0.3, 'rgb(200, 200, 200)', true);
        // Draw.circle(this.ctx, p4, 0.4, 'rgb(200, 200, 200)', true);
        // Draw.circle(this.ctx, p5, 0.5, 'rgb(200, 200, 200)', true);

        this.ctx.moveTo(p1.x, p1.y);
        this.ctx.arcTo(p4.x, p4.y, p3.x, p3.y, radius);
        this.ctx.lineTo(p3.x, p3.y);
        this.ctx.moveTo(p2.x, p2.y);
        this.ctx.arcTo(p5.x, p5.y, p3.x, p3.y, radius);

    }

}