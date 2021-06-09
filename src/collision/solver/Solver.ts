import { SleepingState } from '../../body/Sleeping';
import { Common } from '../../common/Common';
import { Contact } from '../pair/Contact';
import { Engine } from '../../engine/Engine';
import { Pair } from '../pair/Pair';
import { BodyType } from '../../body/Body';
import { Settings } from '../../Settings';

export interface SolverOptions {
    positionIterations?: number;
    velocityIterations?: number;
    constraintIterations?: number;
    warmStarting?: boolean;
}

/**
 * The 'Solver' is a class for solving collisions.
 */

export class Solver {
    engine: Engine;
    options: {
        positionIterations: number;
        velocityIterations: number;
        constraintIterations: number;
        warmStarting: boolean;
    }

    constructor (engine: Engine, options: SolverOptions = {}) {
        this.engine = engine;
        this.options = {
            positionIterations: options.positionIterations ?? 5,
            velocityIterations: options.velocityIterations ?? 5,
            constraintIterations: options.constraintIterations ?? 3,
            warmStarting: options.warmStarting ?? true,
        }
    }

    /**
     * Solves the collisions.
     */
    update () {
        for (const pair of this.engine.manager.pairsToSolve) {
            pair.update();
        }
        if (!this.options.warmStarting) {
            let contact: Contact;
            for (const pair of this.engine.manager.pairsToSolve) {
                for (let i = 0; i < pair.contactsCount; ++i) {
                    contact = pair.contacts[i];
                    contact.tangentImpulse = 0;
                    contact.normalImpulse = 0;
                }
            }
        }

        this.preSolve();

        // solve position
        for (let i = 0; i < this.options.positionIterations; ++i) {
            this.solvePosition();
        }
        this.postSolvePosition();

        // solve constraints
        this.preSolveConstraints();
        for (let i = 0; i < this.options.constraintIterations; ++i) {
            this.solveConstraints();
        }
        this.postSolveConstraints();

        // solve velocity
        if (this.options.warmStarting) this.warmStart();
        for (let i = 0; i < this.options.velocityIterations; ++i) {
            this.solveVelocity();
        }
    }

    /**
     * Prepares the pairs for solving;
     */
    preSolve () {
        for (const body of this.engine.world.bodies.values()) {
            body.pairsCount = 0;
        }

        for (const pair of this.engine.manager.activePairs) {
            ++pair.shapeA.body!.pairsCount;
            ++pair.shapeB.body!.pairsCount;
        }
    }

    /**
     * Solves position correction.
     */
    solvePosition () {
        const pairs: Pair[] = this.engine.manager.pairsToSolve;

        const depthDamping = Settings.depthDamping;
        const slop = Settings.slop;

        let positionImpulse: number,
            impulse: number;

        for (const pair of pairs) {
            // pair.separation = Vector.dot(
            //     pair.normal,
            //     Vector.subtract(pair.penetration, Vector.subtract(pair.shapeB.body!.positionImpulse, pair.shapeA.body!.positionImpulse, temp), temp),
            // );
            //   ||        ||
            //   \/        \/
            pair.separation = 
                pair.normal.x * (pair.penetration.x - pair.shapeB.body!.positionImpulse.x + pair.shapeA.body!.positionImpulse.x) + 
                pair.normal.y * (pair.penetration.y - pair.shapeB.body!.positionImpulse.y + pair.shapeA.body!.positionImpulse.y);
        }

        for (const pair of pairs) {
            const bodyA = pair.shapeA.body!;
            const bodyB = pair.shapeB.body!;

            positionImpulse = (pair.separation - slop) * depthDamping;

            if (bodyA.type !== BodyType.dynamic || bodyB.type !== BodyType.dynamic) {
                positionImpulse *= 2;
            }

            if (bodyA.type === BodyType.dynamic && bodyA.sleepState !== SleepingState.SLEEPING) { 
                impulse = pair.ratioA * positionImpulse / bodyA.pairsCount;
                bodyA.positionImpulse.x -= pair.normal.x * impulse;
                bodyA.positionImpulse.y -= pair.normal.y * impulse;
            }

            if (bodyB.type === BodyType.dynamic && bodyB.sleepState !== SleepingState.SLEEPING) {
                impulse = pair.ratioB * positionImpulse / bodyB.pairsCount;
                bodyB.positionImpulse.x += pair.normal.x * impulse;
                bodyB.positionImpulse.y += pair.normal.y * impulse;
            }
        }
    }

    /**
     * Moves the bodies by solved position correction.
     */
    postSolvePosition () {

        for (const body of this.engine.world.activeBodies.values()) {
            body.translate(body.positionImpulse);

            body.positionImpulse.set(0, 0);
        }
    }

    /**
     * Solves warm starting.
     */
    warmStart () {
        const contacts = this.engine.manager.contactsToSolve;

        let impulseX: number,
            impulseY: number;

        for (const contact of contacts) {
            const bodyA = contact.pair.shapeA.body!;
            const bodyB = contact.pair.shapeB.body!;

            impulseX = contact.pair.normal.x * contact.normalImpulse - contact.pair.normal.y * contact.tangentImpulse;
            impulseY = contact.pair.normal.y * contact.normalImpulse + contact.pair.normal.x * contact.tangentImpulse;

            if (bodyA.type === BodyType.dynamic && bodyA.sleepState !== SleepingState.SLEEPING) {
                bodyA.velocity.x -= impulseX * bodyA.inverseMass;
                bodyA.velocity.y -= impulseY * bodyA.inverseMass;
                bodyA.angularVelocity -= (contact.offsetA.x * impulseY - contact.offsetA.y * impulseX) * bodyA.inverseInertia;
            }
            if (bodyB.type === BodyType.dynamic && bodyB.sleepState !== SleepingState.SLEEPING) {
                bodyB.velocity.x += impulseX * bodyB.inverseMass;
                bodyB.velocity.y += impulseY * bodyB.inverseMass;
                bodyB.angularVelocity += (contact.offsetB.x * impulseY - contact.offsetB.y * impulseX) * bodyB.inverseInertia;
            }
        }
    }

    /**
     * Solves velocity
     */
    solveVelocity () {

        let contact: Contact,
            normalVelocity: number,
            normalImpulse: number,
            tangentVelocity: number,
            tangentImpulse: number,
            angularVelocityA: number,
            angularVelocityB: number,
            rvX: number,
            rvY: number,
            impulseX: number,
            impulseY: number,
            normalX: number,
            normalY: number,
            velocityXA: number,
            velocityYA: number,
            velocityXB: number,
            velocityYB: number;

        for (const pair of this.engine.manager.pairsToSolve) {
            const bodyA = pair.shapeA.body!;
            const bodyB = pair.shapeB.body!;

            normalX = pair.normal.x;
            normalY = pair.normal.y;
            for (let i = 0; i < pair.contactsCount; ++i) {
                contact = pair.contacts[i];

                rvX = (bodyA.velocity.x - contact.offsetA.y * bodyA.angularVelocity) - (bodyB.velocity.x - contact.offsetB.y * bodyB.angularVelocity);
                rvY = (bodyA.velocity.y + contact.offsetA.x * bodyA.angularVelocity) - (bodyB.velocity.y + contact.offsetB.x * bodyB.angularVelocity);

                tangentVelocity = normalX * rvY - normalY * rvX + pair.surfaceVelocity;
                tangentImpulse = tangentVelocity * contact.tangentShare;

                const maxFriction = pair.friction * contact.normalImpulse;

                const newImpulse = Common.clamp(contact.tangentImpulse + tangentImpulse, -maxFriction, maxFriction);
                tangentImpulse = newImpulse - contact.tangentImpulse;
                contact.tangentImpulse = newImpulse;

                impulseX = -tangentImpulse * normalY;
                impulseY = tangentImpulse * normalX;


                if (bodyA.type === BodyType.dynamic && bodyA.sleepState !== SleepingState.SLEEPING) {
                    bodyA.velocity.x -= impulseX * bodyA.inverseMass;
                    bodyA.velocity.y -= impulseY * bodyA.inverseMass;
                    bodyA.angularVelocity -= (contact.offsetA.x * impulseY - contact.offsetA.y * impulseX) * bodyA.inverseInertia;
                }
                if (bodyB.type === BodyType.dynamic && bodyB.sleepState !== SleepingState.SLEEPING) {
                    bodyB.velocity.x += impulseX * bodyB.inverseMass;
                    bodyB.velocity.y += impulseY * bodyB.inverseMass;
                    bodyB.angularVelocity += (contact.offsetB.x * impulseY - contact.offsetB.y * impulseX) * bodyB.inverseInertia;
                }
            }

            velocityXA = bodyA.velocity.x;
            velocityYA = bodyA.velocity.y;
            angularVelocityA = bodyA.angularVelocity;
            velocityXB = bodyB.velocity.x;
            velocityYB = bodyB.velocity.y;
            angularVelocityB = bodyB.angularVelocity;
            for (let i = 0; i < pair.contactsCount; ++i) {
                contact = pair.contacts[i];

                rvX = (velocityXA - contact.offsetA.y * angularVelocityA) - (velocityXB - contact.offsetB.y * angularVelocityB);
                rvY = (velocityYA + contact.offsetA.x * angularVelocityA) - (velocityYB + contact.offsetB.x * angularVelocityB);

                normalVelocity = rvX * normalX + rvY * normalY;
                normalImpulse = (normalVelocity + contact.bias) * contact.normalShare;

                const newImpulse = Math.max(contact.normalImpulse + normalImpulse, 0);
                normalImpulse = newImpulse - contact.normalImpulse;
                contact.normalImpulse = newImpulse;

                impulseX = normalX * normalImpulse;
                impulseY = normalY * normalImpulse;

                if (bodyA.type === BodyType.dynamic && bodyA.sleepState !== SleepingState.SLEEPING) {
                    bodyA.velocity.x -= impulseX * bodyA.inverseMass;
                    bodyA.velocity.y -= impulseY * bodyA.inverseMass;
                    bodyA.angularVelocity -= (contact.offsetA.x * impulseY - contact.offsetA.y * impulseX) * bodyA.inverseInertia;
                }
                if (bodyB.type === BodyType.dynamic && bodyB.sleepState !== SleepingState.SLEEPING) {
                    bodyB.velocity.x += impulseX * bodyB.inverseMass;
                    bodyB.velocity.y += impulseY * bodyB.inverseMass;
                    bodyB.angularVelocity += (contact.offsetB.x * impulseY - contact.offsetB.y * impulseX) * bodyB.inverseInertia;
                }
            }
        }
    }

    preSolveConstraints () {

        const constraintImpulseDamping = Settings.constraintImpulseDamping;
        for (const body of this.engine.world.activeBodies.values()) {
            if (!body.constraints.size) continue;

            body.constraintImpulse.x *= constraintImpulseDamping;
            body.constraintImpulse.y *= constraintImpulseDamping;
            body.constraintAngleImpulse *= constraintImpulseDamping;

            body.translate(body.constraintImpulse);
            body.constraintAngle += body.constraintAngleImpulse;
            body.constraintDir.rotate(body.constraintAngleImpulse);

            body.velocity.x += body.constraintImpulse.x;
            body.velocity.y += body.constraintImpulse.y;
            body.angularVelocity += body.constraintAngleImpulse;
        }
    }

    /**
     * Solves constraint.
     */
    solveConstraints () {
        const constraints = this.engine.world.allConstraints();

        for (const constraint of constraints) {
            constraint.solve();
        }
    }

    postSolveConstraints () {

        for (const body of this.engine.world.activeBodies.values()) {
            if (!body.constraints.size) continue;
            body.setAngle(body.constraintAngle);
        }
    }
}