import { Engine } from '../../../engine/Engine';
import { Pair } from '../../pair/Pair';
import { Manager } from '../Manager';
import { Colliders } from './Colliders';

export class Narrowphase {
    manager: Manager;
    engine: Engine;

    constructor (manager: Manager) {
        this.manager = manager;
        this.engine = manager.engine;
    }

    update (pairs: Iterable<Pair>) {

        for (const pair of pairs) {
            if (!pair.isSleeping) {
                pair.isActive = false;

                Colliders[pair.shapeA.type | pair.shapeB.type](pair);

                if (pair.isActive) {
                    pair.isSensor = pair.shapeA.isSensor || pair.shapeB.isSensor;
                    this.manager.activePairs.push(pair);
                    if (!pair.isSleeping && !pair.isSensor) {
                        this.manager.pairsToSolve.push(pair);
                        for (let i = 0; i < pair.contactsCount; ++i) {
                            this.manager.contactsToSolve.push(pair.contacts[i]);
                        }
                    }
                    if (!pair.isActivePrev) {
                        this.manager.startedPairs.push(pair);
                    }
                } else if (pair.isActivePrev) {
                    this.manager.endedPairs.push(pair);
                }
            } else {
                this.manager.activePairs.push(pair);
            }
        }
    }
}