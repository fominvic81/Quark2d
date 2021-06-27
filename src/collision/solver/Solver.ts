import { SleepingState } from '../../body/Sleeping';
import { Common } from '../../common/Common';
import { Contact } from '../pair/Contact';
import { Engine } from '../../engine/Engine';
import { Body, BodyType } from '../../body/Body';
import { Settings } from '../../Settings';

export interface SolverOptions {
    iterations?: number;
    jointIterations?: number;
    warmStarting?: boolean;
}

export class Solver {
    engine: Engine;
    options: {
        iterations: number;
        jointIterations: number;
        warmStarting: boolean;
    }

    constructor (engine: Engine, options: SolverOptions = {}) {
        this.engine = engine;
        this.options = {
            iterations: options.iterations ?? 8,
            jointIterations: options.jointIterations ?? 3,
            warmStarting: options.warmStarting ?? true,
        }
    }

    preStep () {
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
            for (const joint of this.engine.world.joints.values()) {
                joint.impulse = 0;
            }
        }

        for (const joint of this.engine.world.joints.values()) {
            joint.preSovle();
        }
    }

    step () {
        if (this.options.warmStarting) {
            this.warmStart();

            for (const joint of this.engine.world.joints.values()) {
                joint.warmStart();
            }
        }

        for (let i = 0; i < this.options.jointIterations; ++i) {
            for (const joint of this.engine.world.joints.values()) {
                joint.solve();
            }
        }
        for (let i = 0; i < this.options.iterations; ++i) {
            this.solve();
        }
    }

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
                bodyA.velocity.x += impulseX * bodyA.inverseMass;
                bodyA.velocity.y += impulseY * bodyA.inverseMass;
                bodyA.angularVelocity += (contact.offsetA.x * impulseY - contact.offsetA.y * impulseX) * bodyA.inverseInertia;
            }
            if (bodyB.type === BodyType.dynamic && bodyB.sleepState !== SleepingState.SLEEPING) {
                bodyB.velocity.x -= impulseX * bodyB.inverseMass;
                bodyB.velocity.y -= impulseY * bodyB.inverseMass;
                bodyB.angularVelocity -= (contact.offsetB.x * impulseY - contact.offsetB.y * impulseX) * bodyB.inverseInertia;
            }
        }
    }

     solve () {

        let contact: Contact,
            bodyA: Body,
            bodyB: Body,
            normalVelocity: number,
            normalImpulse: number,
            tangentVelocity: number,
            tangentImpulse: number,
            rvX: number,
            rvY: number,
            bX: number,
            bY: number,
            maxFriction: number,
            newImpulse: number,
            separation: number,
            impulseX: number,
            impulseY: number,
            normalX: number,
            normalY: number;

        for (const pair of this.engine.manager.pairsToSolve) {
            bodyA = pair.shapeA.body!;
            bodyB = pair.shapeB.body!;

            normalX = pair.normal.x;
            normalY = pair.normal.y;
            for (let i = 0; i < pair.contactsCount; ++i) {
                contact = pair.contacts[i];

                rvX = (bodyB.velocity.x - contact.offsetB.y * bodyB.angularVelocity) - (bodyA.velocity.x - contact.offsetA.y * bodyA.angularVelocity);
                rvY = (bodyB.velocity.y + contact.offsetB.x * bodyB.angularVelocity) - (bodyA.velocity.y + contact.offsetA.x * bodyA.angularVelocity);

                tangentVelocity = normalX * rvY - normalY * rvX - pair.surfaceVelocity;
                tangentImpulse = tangentVelocity * contact.tangentShare;

                maxFriction = -contact.normalImpulse * pair.friction;

                newImpulse = Common.clamp(contact.tangentImpulse + tangentImpulse, -maxFriction, maxFriction);
                tangentImpulse = newImpulse - contact.tangentImpulse;
                contact.tangentImpulse = newImpulse;

                normalVelocity = rvX * normalX + rvY * normalY;
                normalImpulse = (normalVelocity + contact.bias) * contact.normalShare;

                newImpulse = Math.min(contact.normalImpulse + normalImpulse, 0);
                normalImpulse = newImpulse - contact.normalImpulse;
                contact.normalImpulse = newImpulse;

                impulseX = normalX * normalImpulse - normalY * tangentImpulse;
                impulseY = normalY * normalImpulse + normalX * tangentImpulse;

                if (bodyA.type === BodyType.dynamic && bodyA.sleepState !== SleepingState.SLEEPING) {
                    bodyA.velocity.x += impulseX * bodyA.inverseMass;
                    bodyA.velocity.y += impulseY * bodyA.inverseMass;
                    bodyA.angularVelocity += (contact.offsetA.x * impulseY - contact.offsetA.y * impulseX) * bodyA.inverseInertia;
                }
                if (bodyB.type === BodyType.dynamic && bodyB.sleepState !== SleepingState.SLEEPING) {
                    bodyB.velocity.x -= impulseX * bodyB.inverseMass;
                    bodyB.velocity.y -= impulseY * bodyB.inverseMass;
                    bodyB.angularVelocity -= (contact.offsetB.x * impulseY - contact.offsetB.y * impulseX) * bodyB.inverseInertia;
                }

                bX = (bodyB.positionBias.x - contact.offsetB.y * bodyB.positionBiasAngle) - (bodyA.positionBias.x - contact.offsetA.y * bodyA.positionBiasAngle);
                bY = (bodyB.positionBias.y + contact.offsetB.x * bodyB.positionBiasAngle) - (bodyA.positionBias.y + contact.offsetA.x * bodyA.positionBiasAngle);

                separation = contact.positionBias - (normalX * bX + normalY * bY);
                normalImpulse = (separation - Settings.slop) * contact.normalShare;

                newImpulse = Math.max(contact.positionImpulse + normalImpulse, 0);
                normalImpulse = newImpulse - contact.positionImpulse;
                contact.positionImpulse = newImpulse;

                impulseX = -normalImpulse * normalX;
                impulseY = -normalImpulse * normalY;

                if (bodyA.type === BodyType.dynamic && bodyA.sleepState !== SleepingState.SLEEPING) {
                    bodyA.positionBias.x += impulseX * bodyA.inverseMass;
                    bodyA.positionBias.y += impulseY * bodyA.inverseMass;
                    bodyA.positionBiasAngle += (contact.offsetA.x * impulseY - contact.offsetA.y * impulseX) * bodyA.inverseInertia;
                }
                if (bodyB.type === BodyType.dynamic && bodyB.sleepState !== SleepingState.SLEEPING) {
                    bodyB.positionBias.x -= impulseX * bodyB.inverseMass;
                    bodyB.positionBias.y -= impulseY * bodyB.inverseMass;
                    bodyB.positionBiasAngle -= (contact.offsetB.x * impulseY - contact.offsetB.y * impulseX) * bodyB.inverseInertia;
                }
            }
        }
    }
}