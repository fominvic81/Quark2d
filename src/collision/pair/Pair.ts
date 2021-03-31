import { Body } from '../../body/Body';
import { Common } from '../../common/Common';
import { ShapePair } from './ShapePair';

export class Pair {
    bodyA: Body;
    bodyB: Body;
    id: number;
    shapePairs: Map<number, ShapePair> = new Map();
    activeShapePairs: Array<ShapePair> = [];
    activeShapePairsBroadphase: Set<ShapePair> = new Set();
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