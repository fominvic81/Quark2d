import { Engine } from '../engine/Engine';
import { Settings } from '../Settings';
import { BodyType } from './Body';

export enum SleepingType {
    NO_SLEEPING,
    BODY_SLEEPING,
    ISLAND_SLEEPING,
}

export interface SleepingOptions {
    type?: SleepingType;
}

/**
 * The 'Sleeping is a class for manage the sleeping of bodies.
 */

export class Sleeping {
    engine: Engine;
    type: number;

    /**
     * @param engine
     * @param options
     */
    constructor (engine: Engine, options: SleepingOptions = {}) {

        this.engine = engine;
        this.type = options.type !== undefined ? options.type : SleepingType.NO_SLEEPING;

    }

    /**
     * Sets the sleeping type to the given.
     * @param type 
     */
    setType (type: SleepingType) {
        if (this.type === type) return;
        if (this.type === SleepingType.NO_SLEEPING) {
            this.type = type;
            return;
        }
        this.type = type;

        for (const body of this.engine.world.sleepingBodies.values()) {
            body.setSleeping(false);
        }
    }

    /**
     * Updates the sleep state of bodies depending on their motion.
     * @param delta
     */
    afterSolve (delta: number) {

        const motionSleepLimit = Settings.motionSleepLimit;
        const sleepyTime = Settings.sleepyTime;

        switch (this.type) {
            case SleepingType.NO_SLEEPING: return;
            case SleepingType.BODY_SLEEPING:
                for (const body of this.engine.world.activeBodies.values()) {
                    if (!body.canSleep || body.joints.size) continue;

                    if (body.motion <= motionSleepLimit) {
                        body.sleepyTimer += delta;
                        body.sleepyTimer = Math.min(body.sleepyTimer, sleepyTime);
                    } else if (body.sleepyTimer > 0) {
                        body.sleepyTimer -= delta;
                        body.sleepyTimer = Math.max(body.sleepyTimer, 0);
                    }

                    if (body.sleepyTimer >= sleepyTime) {
                        body.setSleeping(true);
                    }
                }
                break;
            case SleepingType.ISLAND_SLEEPING:
                for (const body of this.engine.world.activeBodies.values()) {

                    if (body.motion <= motionSleepLimit) {
                        body.sleepyTimer += delta;
                        body.sleepyTimer = Math.min(body.sleepyTimer, sleepyTime);
                    } else if (body.sleepyTimer > 0) {
                        body.sleepyTimer -= delta;
                        body.sleepyTimer = Math.max(body.sleepyTimer, 0);
                    }
                }
                for (const island of this.engine.islandManager.islands) {
                    let sleep = true;
                    for (const body of island.bodies) {
                        if (body.sleepyTimer < sleepyTime) {
                            sleep = false;
                            break;
                        }
                    }
                    if (sleep) {
                        for (const body of island.bodies) {
                            body.setSleeping(true);
                        }
                    } else {
                        for (const body of island.bodies) {
                            if (body.isSleeping) body.setSleeping(false);
                        }
                    }
                }
                break;
        }
    }

    /**
     * Updates the sleep state of bodies depending on their collisions.
     */
    afterCollisions () {

        const collisionMotionSleepLimit = Settings.collisionMotionSleepLimit;

        switch (this.type) {
            case SleepingType.NO_SLEEPING: return;
            case SleepingType.BODY_SLEEPING:
                const pairs = this.engine.manager.activePairs;

                for (const pair of pairs) {
                    const bodyA = pair.shapeA.body!;
                    const bodyB = pair.shapeB.body!;

                    if (!bodyA.isSleeping && !bodyB.isSleeping) continue;

                    const bodyASleeping = bodyA.isSleeping;
                    const sleepingBody = bodyASleeping ? bodyA : bodyB;

                    if (sleepingBody.type !== BodyType.dynamic) continue;

                    const awakeBody = bodyASleeping ? bodyB : bodyA;

                    if (awakeBody.motion > collisionMotionSleepLimit) {
                        sleepingBody.setSleeping(false);
                    }
                }

                for (const pair of this.engine.manager.endedPairs) {
                    if (pair.shapeA.body?.type === BodyType.dynamic) pair.shapeA.body?.setSleeping(false);
                    if (pair.shapeB.body?.type === BodyType.dynamic) pair.shapeB.body?.setSleeping(false);
                }

                for (const pair of this.engine.manager.startedPairs) {
                    if (pair.shapeA.body?.type === BodyType.dynamic) pair.shapeA.body?.setSleeping(false);
                    if (pair.shapeB.body?.type === BodyType.dynamic) pair.shapeB.body?.setSleeping(false);
                }
                break;
            case SleepingType.ISLAND_SLEEPING:

                for (const pair of this.engine.manager.endedPairs) {
                    if (pair.shapeA.body?.type === BodyType.dynamic) pair.shapeA.body?.setSleeping(false);
                    if (pair.shapeB.body?.type === BodyType.dynamic) pair.shapeB.body?.setSleeping(false);
                }
                
                for (const pair of this.engine.manager.startedPairs) {
                    if (pair.shapeA.body?.type === BodyType.dynamic) pair.shapeA.body?.setSleeping(false);
                    if (pair.shapeB.body?.type === BodyType.dynamic) pair.shapeB.body?.setSleeping(false);
                }
                break;
        }
    }
}