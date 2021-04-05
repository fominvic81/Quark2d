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
            pair.isActive = false;

            Colliders[pair.shapeA.type | pair.shapeB.type](pair);

            if (pair.isActive) {
                for (let i = 0; i < pair.contactsCount; ++i) {
                    this.manager.contacts.push(pair.contacts[i]);
                }
                this.manager.activePairs.push(pair);
                if (!pair.isSleeping) {
                    this.manager.pairsToSolve.push(pair);
                }
                if (!pair.isActivePrev) {
                    this.manager.startedPairs.push(pair);
                }
            } else if (pair.isActivePrev) {
                this.manager.endedPairs.push(pair);
            }
        }
    }
}