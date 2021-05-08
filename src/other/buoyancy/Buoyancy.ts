import { Convex } from '../../body/shapes/Convex';
import { Shape, ShapeType } from '../../body/shapes/Shape';
import { Common } from '../../common/Common';
import { Engine } from '../../engine/Engine';
import { Vector } from '../../math/Vector';
import { Vertices } from '../../math/Vertices';
import { clip } from './Clip';
import { BuoyancyPair } from './Pair';

const temp = new Vector();
const force = new Vector();
const offset = new Vector();
const relativeVelocity = new Vector();
const edge = new Vector();
const mid = new Vector();
const normal = new Vector();
const center = new Vector();

let f: number,
    simpleDrag: number,
    maxSimpleDrag: number,
    drag: number,
    maxDrag: number,
    lift: number,
    maxLift: number,
    flow: Vector;

const solvePolygonPolygon = (engine: Engine, pair: BuoyancyPair) => {
    const shapeA = pair.shapeA;
    const shapeB = pair.shapeB;
    const bodyA = shapeA.body!;
    const bodyB = shapeB.body!;
    const density = shapeA.density;
    const clipped = clip(<Convex>shapeA, <Convex>shapeB);
    if (!clipped || clipped.length < 3) return;

    const options = <BuoyancyUserData>shapeA.userData;
    simpleDrag = options.simpleDrag;
    maxSimpleDrag = options.maxSimpleDrag;
    drag = options.drag;
    maxDrag = options.maxDrag;
    lift = options.lift;
    maxLift = options.maxLift;
    flow = options.flow;

    const area = Vertices.area(clipped);
    Vertices.center(clipped, center, area);
    
    const displacedMass = area * density;
    engine.gravity.scale(-displacedMass, force);

    bodyB.applyForce(force, Vector.subtract(center, bodyB.center, offset));

    // simple drag
    bodyA.getPointVelocity(center, relativeVelocity).add(bodyB.getPointVelocity(center, temp)).subtract(flow);

    f = Math.min(density * relativeVelocity.lengthSquared(), maxSimpleDrag) * simpleDrag;
    relativeVelocity.scale(-f, force);
    bodyB.applyForce(force, Vector.subtract(center, bodyB.center, offset));
    bodyB.torque -= area * density * bodyB.angularVelocity;

    for (let i = 0; i < clipped.length; ++i) {
        const vertex = clipped[i];
        const next = clipped[(i + 1) % clipped.length];

        Vector.mid(next, vertex, mid);
        Vector.subtract(next, vertex, edge);

        const length = edge.length();
        edge.divide(length);

        edge.rotate270(normal);

        bodyA.getPointVelocity(mid, relativeVelocity).add(bodyB.getPointVelocity(mid, temp)).subtract(flow);
        const velLengthSquared = relativeVelocity.lengthSquared();
        const velLength = Math.sqrt(velLengthSquared);
        relativeVelocity.divide(velLength);

        const dot = Vector.dot(normal, relativeVelocity);
        if (dot <= 0) continue;
        // drag
        f = Math.min(dot * length * density * velLengthSquared, maxDrag) * drag;
        relativeVelocity.scale(-f, force);
        bodyB.applyForce(force, Vector.subtract(mid, bodyB.center,offset));

        // lift
        const dot2 = Vector.dot(edge, relativeVelocity);
        const liftF = Common.clamp(dot * dot2 * length * density * velLengthSquared, -maxLift, maxLift) * lift;
        const liftDir = relativeVelocity.rotate90();
        liftDir.scale(liftF, force);
        bodyB.applyForce(force, Vector.subtract(mid, bodyB.center, offset));
    }
}

const solve: {[index: number]: {(engine: Engine, pair: BuoyancyPair): void}} = {};

solve[ShapeType.CONVEX | ShapeType.CONVEX] = solvePolygonPolygon;

export interface BuoyancyOptions {
    simpleDrag?: number;
    maxSimpleDrag?: number;
    drag?: number;
    maxDrag?: number;
    lift?: number;
    maxLift?: number;
    flow?: Vector;
}

export class BuoyancyUserData {
    isBuoyancy: boolean;
    simpleDrag: number;
    maxSimpleDrag: number;
    drag: number;
    maxDrag: number;
    lift: number;
    maxLift: number;
    flow: Vector = new Vector();

    constructor (options: BuoyancyOptions = {}) {
        this.isBuoyancy = true;

        this.simpleDrag = options.simpleDrag ?? 500;
        this.maxSimpleDrag = options.maxSimpleDrag ?? 5;
        this.drag = options.drag ?? 500;
        this.maxDrag = options.maxDrag ?? 25;
        this.lift = options.lift ?? 150;
        this.maxLift = options.maxLift ?? 500;
        if (options.flow) options.flow.clone(this.flow);
    }
}

export const Buoyancy = (engine: Engine) => {

    const allPairs: Map<number, BuoyancyPair> = new Map();
    const pairs: Set<BuoyancyPair> = new Set();

    const addPair = (shapeA: Shape, shapeB: Shape) => {
        const id = Common.combineId(shapeA.id, shapeB.id);

        const solveFunc = solve[shapeA.type | shapeB.type];
        if (!solveFunc) return;

        const p = allPairs.get(id);
        const buoyancyPair = p || new BuoyancyPair(shapeA, shapeB, solveFunc);

        if (!p) allPairs.set(id, buoyancyPair);
        
        pairs.add(buoyancyPair);
    }

    const startedEventId = engine.events.on('started-collisions', (event) => {

        for (const pair of event.pairs) {
            const userDataA = pair.shapeA.userData;
            const userDataB = pair.shapeB.userData;
            let isA = false;
            let isB = false;
            if (userDataA) {
                if (userDataA.isBuoyancy) {
                    isA = true
                }
            }
            if (userDataB) {
                if (userDataB.isBuoyancy) {
                    isB = true;
                }
            }
            if (isA) {
                if (isB) continue;
                addPair(pair.shapeA, pair.shapeB);
            }
            if (isB) {
                addPair(pair.shapeB, pair.shapeA);
            }
        }
    });

    const endedEventId = engine.events.on('ended-collisions', (event) => {
        for (const pair of event.pairs) {
            pairs.delete(pair);
        }
    });

    const updateEventId = engine.events.on('before-update', () => {

        for (const pair of pairs) {
            pair.solve(engine, pair);
        }

    });


    return () => {
        engine.events.off(startedEventId);
        engine.events.off(endedEventId);
        engine.events.off(updateEventId);
    }
}