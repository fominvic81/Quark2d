import { Body } from '../../body/Body';
import { Common } from '../../common/Common';

export class Pair {
    bodyA: Body;
    bodyB: Body;
    id: number;
    shapePairs: Map<number, any> = new Map(); // TODO-types
    activeShapePairs: Array<any> = [];  // TODO-types
    activeShapePairsBroadphase: Set<any> = new Set();  // TODO-types
    isActiveBroadphase: boolean = false;
    isActive: boolean = false;
    isActivePrev: boolean = false;
    isSleeping: boolean = false;
    contactsCount: number = 0;

    constructor (bodyA: Body, bodyB: Body) {
        this.bodyA = bodyA;
        this.bodyB = bodyB;
        this.id = Common.combineId(this.bodyA.id, this.bodyB.id);
    }
};