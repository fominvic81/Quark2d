import { Common } from '../../common/Common';


export class Pair {

    constructor (bodyA, bodyB) {
        this.bodyA = bodyA;
        this.bodyB = bodyB;
        this.id = Common.combineId(this.bodyA.id, this.bodyB.id);
        this.shapePairs = new Map();
        this.activeShapePairs = [];
        this.isActive = false;
        this.isSleeping = false;
        this.contacts = [];
        this.prev = {
            isActive: false,
            isSleeping: false,
        }
    }

    reset () {
        this.contacts.length = 0;
    }

    updatePrev () {
        this.prev.isActive = this.isActive;
        this.prev.isSleeping = this.isSleeping;
    }
    
};