import { Common } from '../../common/Common';


export class Pair {

    constructor (bodyA, bodyB) {
        this.bodyA = bodyA;
        this.bodyB = bodyB;
        this.id = Common.combineId(this.bodyA.id, this.bodyB.id);
        this.shapePairs = new Map();
        this.activeShapePairs = [];
        this.isActiveBroadphase = false;
        this.activeShapePairsCount = 0;
        this.isActive = false;
        this.isActivePrev = false;
        this.isSleeping = false;
        this.contactsCount = 0;
    }
    
};