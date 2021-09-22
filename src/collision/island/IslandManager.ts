import { Engine } from '../../engine/Engine';
import { Body, BodyType } from '../../body/Body';
import { Joint } from '../../joint/Joint';

export class Island {
    bodies: Set<Body> = new Set();
    joints: Set<Joint> = new Set();

    clear () {
        this.bodies.clear();
        this.joints.clear();
        return this;
    }
}

export class IslandManager {
    engine: Engine;
    islands: Island[] = [];
    private islandPool: Island[] = [];

    constructor (engine: Engine) {
        this.engine = engine;
    }

    update () {
        this.islandPool.push(...this.islands);
        this.islands.length = 0;

        for (const body of this.engine.world.bodies.values()) {
            body.visited = false;
            body.island = undefined;
        }
        for (const joint of this.engine.world.joints.values()) {
            joint.visited = false;
        }

        for (const body of this.engine.world.bodies.values()) {
            if (body.type !== BodyType.dynamic) continue;
            if (body.visited) continue;
            const island = this.getNewIsland();

            const stack = [body];

            while (stack.length) {
                const currentBody = stack.pop()!;
                if (currentBody.visited) continue;

                currentBody.visited = true;
                if (!(currentBody.type === BodyType.dynamic)) continue;
                island.bodies.add(currentBody);
                currentBody.island = island;

                for (const pair of currentBody.pairs.values()) {
                    if (pair.shapeA.body === currentBody) {
                        stack.push(pair.shapeB.body!);
                    } else {
                        stack.push(pair.shapeA.body!);
                    }
                }

                for (const joint of currentBody.joints) {
                    if (joint.visited) continue;
                    joint.visited = true;
                    island.joints.add(joint);
                    if (joint.bodyA === currentBody) {
                        if (joint.bodyB) stack.push(joint.bodyB);
                    } else {
                        if (joint.bodyA) stack.push(joint.bodyA);
                    }
                }
            }
            this.islands.push(island);
        }
    }

    private getNewIsland () {
        const island = this.islandPool.pop()?.clear() || new Island();
        return island;
    }
}