import { Vector } from '../../math/Vector';
import { Draw } from './Draw';
import { ShapeType } from '../../body/shapes/Shape';
import { Mouse, QMouseEvent, QWheelEvent } from '../mouse/Mouse';
import { AABB } from '../../math/AABB';
import { Joint, JointType } from '../../joint/Joint';
import { Engine } from '../../engine/Engine';
import { Body } from '../../body/Body';
import { Convex } from '../../body/shapes/Convex';
import { Edge } from '../../body/shapes/Edge';
import { DistJoint } from '../../joint/DistJoint';
import { Settings } from '../../Settings';

export interface RenderOptions {
    backgroundColor?: string;
    showJoints?: boolean;
    showSleeping?: boolean;
    showRadius?: boolean;

    showStatus?: boolean;

    canvas?: HTMLCanvasElement;

    width?: number;
    height?: number;
}

/**
 * The Render is a class, that provides methods for rendering the world, based on HTML5 canvas.
 */

export class Render {
    engine: Engine;
    options: {
        scale: Vector;
        translate: Vector;

        lineWidth: number;

        backgroundColor: string;
        showJoints: boolean;
        showSleeping: boolean;
        showRadius: boolean;

        showStatus: boolean;
    };
    aabb: AABB = new AABB();
    canvas: HTMLCanvasElement;
    ctx: CanvasRenderingContext2D;

    element: HTMLElement;

    statusTimer: number = 0;
    statusText: string = '';
    tps: number = 0;

    mouse: Mouse;

    constructor (engine: Engine, element: HTMLElement = document.body, options: RenderOptions = {}) {

        this.engine = engine;

        this.options = {
            scale: new Vector(20, 20),
            translate: new Vector(),

            lineWidth: 1,

            backgroundColor: options.backgroundColor ?? 'rgb(48, 48, 48)',
            showJoints: options.showJoints ?? true,
            showSleeping: options.showSleeping ?? true,
            showRadius: options.showRadius ?? true,

            showStatus: options.showStatus ?? false,
        }

        this.canvas = options.canvas || this.createCanvas(options.width ?? 800, options.height ?? 600);
        this.ctx = <CanvasRenderingContext2D>this.canvas.getContext('2d');

        this.statusTimer = 0;
        this.statusText = '';

        this.element = element;
        this.element.appendChild(this.canvas);

        this.mouse = new Mouse(this);

        this.mouse.on('mouse-move', (event) => {this.mouseMove(event)});
        this.mouse.on('wheel', (event) => {this.mouseWheel(event)});
    }

    /**
     * Renders world. Step should be called every time the scene changes.
     * @param timestamp
     */
    update (dt: number, tps: number) {

        this.statusTimer += dt;
        this.tps = tps;

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
        const allJoints = this.engine.world.allJoints();

        const bodies = [];

        for (const body of allBodies) {
            for (const shape of body.shapes) {
                if (this.aabb.overlaps(shape.aabb)) {
                    bodies.push(body);
                    break;
                }
            }
        }

        this.bodies(bodies);
        if (this.options.showJoints) {
            this.joints(allJoints);
        }
    }

    updateAABB () {
        this.aabb.minX = (-this.canvas.width / 2) / this.options.scale.x - this.options.translate.x;
        this.aabb.maxX = (this.canvas.width / 2) / this.options.scale.x - this.options.translate.x;

        this.aabb.minY = (-this.canvas.height / 2) / this.options.scale.y - this.options.translate.y;
        this.aabb.maxY = (this.canvas.height / 2) / this.options.scale.y - this.options.translate.y;
    }

    bodies (bodies: Body[]) {

        for (const body of bodies) {
            const color = (!body.isSleeping || !this.options.showSleeping) ? 'rgb(200, 200, 200)' : 'rgb(100, 100, 100)';
            for (const shape of body.shapes) {
                const pos = shape.position;
                switch (shape.type) {
                    case ShapeType.CIRCLE:
                        Draw.circle(this.ctx, pos, Math.max(shape.radius - Settings.defaultRadius, Settings.defaultRadius), color, false, this.options.lineWidth / 20);
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

    joints (joints: Joint[]) {

        for (const joint of joints) {
            if (!joint.bodyA && !joint.bodyB) continue;
            const start = joint.getWorldPointA();
            const end = joint.getWorldPointB();

            switch (joint.type) {
                case JointType.DIST_JOINT:
                    const distjoint = <DistJoint>joint;

                    if (distjoint.length <= 1 || distjoint.stiffness > 0.8) {
                        Draw.line(this.ctx, start, end, 'rgb(128, 128, 128)', this.options.lineWidth / 20);
                    } else {
                        const delta = Vector.subtract(end, start, Vector.temp[0]);

                        const normal = distjoint.normal.clone(Vector.temp[1]).rotate90();
                        const count = Math.max(distjoint.length * 2, 4);

                        this.ctx.beginPath();
                        this.ctx.moveTo(start.x, start.y);

                        for (let i = 1; i < count; ++i) {
                            const side = i % 2 === 0 ? 1 : -1;
                            const offset = normal.clone(Vector.temp[2]).scale(side * 0.25);
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

    status () {
        if (this.statusTimer >= 0.1) {
            this.statusTimer -= 0.1;
            this.statusText = '';

            this.statusText += `tps: ${Math.round(<number>this.tps)}   `;

            this.statusText += `bodies: ${this.engine.world.bodies.size}   `

            const alljoints = this.engine.world.allJoints();

            this.statusText += `joints: ${alljoints.length}   `

            this.statusText += `broadphasePairs: ${this.engine.manager.aabbTree.getPairsCount()}   `;
            this.statusText += `midphasePairs: ${this.engine.manager.midphase.getPairsCount()}   `;
            this.statusText += `narrowphasePairs: ${this.engine.manager.getPairsCount()}   `;

            this.statusText += `iterations: ${this.engine.solver.options.iterations}   `;
            this.statusText += `jointIterations: ${this.engine.solver.options.jointIterations}   `;
        }

        this.ctx.font = '12px Arial';

        this.ctx.fillStyle = 'rgb(128, 128, 128)';
        this.ctx.fillText(this.statusText, 20, 20, this.canvas.width - 50);
    }

    scale (scale: Vector) {
        this.options.scale.x *= scale.x;
        this.options.scale.y *= scale.y;
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

    mouseWheel (event: QWheelEvent) {
        this.options.scale.x -= event.event.deltaY * this.options.scale.x / 1000;
        this.options.scale.y -= event.event.deltaY * this.options.scale.y / 1000;
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

    convex (convex: Convex, color: string, fill: boolean = true, lineWidth: number) {

        const radius = convex.radius;
        const vertices = convex.vertices;
        if (radius <= Settings.defaultRadius) {
            Draw.polygon(this.ctx, vertices, color, fill, lineWidth);
            return;
        }
        
        const normals = convex.normals;
    
        const first = Vector.add(vertices[0], normals[vertices.length - 1].clone(Vector.temp[0]).scale(radius), Vector.temp[0]);

        this.ctx.beginPath();
    
        this.ctx.moveTo(first.x, first.y);

        let prevOffset = normals[vertices.length - 1].clone(Vector.temp[0]).scale(radius);

        for (let i = 0; i < vertices.length; ++i) {
            const offset = normals[i].clone(Vector.temp[1]).scale(radius);

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

    edge (edge: Edge, color: string, lineWidth: number) {
        const radius = edge.radius;

        if (radius <= Settings.defaultRadius) {
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

        const p1 = edge.normal.clone(Vector.temp[0]).scale(edge.radius).rotate90().add(edge.start);
        const p2 = edge.normal.clone(Vector.temp[1]).scale(-edge.radius).rotate90().add(edge.end);
        const p3 = edge.normal.clone(Vector.temp[2]).scale(edge.radius * dir).add(edge.end);
        const p4 = edge.normal.clone(Vector.temp[3]).scale(edge.radius * dir).add(p1);
        const p5 = edge.normal.clone(Vector.temp[4]).scale(edge.radius * dir).add(p2);

        this.ctx.moveTo(p1.x, p1.y);
        this.ctx.arcTo(p4.x, p4.y, p3.x, p3.y, radius);
        this.ctx.lineTo(p3.x, p3.y);
        this.ctx.moveTo(p2.x, p2.y);
        this.ctx.arcTo(p5.x, p5.y, p3.x, p3.y, radius);

    }

}