import { Vector } from '../math/Vector';

// TODO: Island sleeping

export class Sleeping {

    constructor (engine) {

        this.engine = engine;
        this.type = Sleeping.BODY_SLEEPING;

    }

    update (delta) {
        const bodies = this.engine.world.allBodies();

        for (const body of bodies) {
            if (body.isStatic && body.sleepState === Sleeping.SLEEPING) continue;
            
            if (body.force.x !== 0 || body.force.y !== 0) {
                body.setSleeping(Sleeping.AWAKE);
                continue;
            }

            if (body.sleepState == Sleeping.SLEEPING) continue;

            body.motion = (Vector.lengthSquared(body.velocity) + Math.pow(body.angularVelocity, 2) / 4) * 0.8 + body.motion * 0.2;

            if (body.motion <= Sleeping.MOTION_SLEEP_LIMIT) {
                body.sleepyTimer += delta;
            } else if (body.sleepyTimer > 0) {
                body.sleepyTimer -= delta;
            }

            if (body.sleepyTimer >= Sleeping.SLEEPY_TIME_LIMIT) {
                body.setSleeping(Sleeping.SLEEPING);
            }

        }
    }

    afterCollisions () {

        const pairs = this.engine.narrowphase.activePairs;

        for (const pair of pairs) {

            if (pair.bodyA.sleepState !== Sleeping.SLEEPING && pair.bodyB.sleepState !== Sleeping.SLEEPING) continue;

            const bodyASleeping = pair.bodyA.sleepState === Sleeping.SLEEPING;
            const sleepingBody = bodyASleeping ? pair.bodyA : pair.bodyB;
            
            if (sleepingBody.isStatic) continue;

            const awakeBody = bodyASleeping ? pair.bodyB : pair.bodyA;

            if (awakeBody.motion > Sleeping.COLLISION_MOTION_SLEEP_LIMIT) {
                sleepingBody.setSleeping(Sleeping.AWAKE);
            }
        }

        const endedPairs = this.engine.narrowphase.endedPairs;

        for (const pair of endedPairs) {
            if (!pair.bodyA.isStatic) pair.bodyA.setSleeping(Sleeping.AWAKE);
            if (!pair.bodyB.isStatic) pair.bodyB.setSleeping(Sleeping.AWAKE);
        }

        const startedPairs = this.engine.narrowphase.startedPairs;

        for (const pair of startedPairs) {
            if (!pair.bodyA.isStatic) pair.bodyA.setSleeping(Sleeping.AWAKE);
            if (!pair.bodyB.isStatic) pair.bodyB.setSleeping(Sleeping.AWAKE);
        }
    }
}

Sleeping.AWAKE = 0;
Sleeping.SLEEPING = 1;
Sleeping.READY_FALL_ASLEEP = 2;

Sleeping.MOTION_SLEEP_LIMIT = 0.000018;
Sleeping.COLLISION_MOTION_SLEEP_LIMIT = 0.00004;
Sleeping.SLEEPY_TIME_LIMIT = 1;

Sleeping.BODY_SLEEPING = 0;
Sleeping.ISLAND_SLEEPING = 1;