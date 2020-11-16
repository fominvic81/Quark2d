import { Common } from '../../common/Common';
import { Vector } from '../../math/Vector';
import { Contact } from './Contact';


export class ShapePair {

    constructor (shapeA, shapeB) {
        this.shapeA = shapeA;
        this.shapeB = shapeB;
        this.id = Common.combineId(this.shapeA.id, this.shapeB.id);
        this.isActive = false;
        this.depth = 0;
        this.separation = 0;
        this.normal = new Vector();
        this.tangent = new Vector();
        this.penetration = new Vector();
        this.contactsCount = 0;
        this.contacts = [
            new Contact(),
            new Contact(),
        ];
        this.prev = {
            isActive: false,
            normal: new Vector(),
            tangent: new Vector(),
            penetration: new Vector(),
            depth: 0,
        }
        this.isActiveBroadphase = false;
        this.broadphaseCellsCount = 0;
    }

    update () {
        Vector.scale(this.normal, this.depth, this.penetration);
        Vector.rotate90(this.normal, this.tangent);
        this.friction = Math.min(this.shapeA.friction, this.shapeB.friction);
        this.frictionStatic = Math.min(this.shapeA.frictionStatic, this.shapeB.frictionStatic);
        this.restitution = Math.max(this.shapeA.restitution, this.shapeB.restitution);
    }

    updatePrev () {
        this.prev.isActive = this.isActive;
        this.prev.depth = this.depth;
        Vector.clone(this.normal, this.prev.normal);
        Vector.clone(this.tangent, this.prev.tangent);
        Vector.clone(this.penetration, this.prev.penetration);
    }

}