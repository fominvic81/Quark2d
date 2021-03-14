import { Common } from '../../common/Common';
import { Vector } from '../../math/Vector';
import { Contact } from './Contact';


export class ShapePair {

    constructor (shapeA, shapeB, pair) {
        this.shapeA = shapeA;
        this.shapeB = shapeB;
        this.pair = pair;
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
        this.isActiveBroadphase = false;
        this.broadphaseCellsCount = 0;
    }

    update () {
        Vector.scale(this.normal, this.depth, this.penetration);
        Vector.rotate90(this.normal, this.tangent);
        this.friction = Math.min(this.shapeA.friction, this.shapeB.friction);
        this.restitution = Math.max(this.shapeA.restitution, this.shapeB.restitution);
        this.surfaceVelocity = this.shapeA.surfaceVelocity + this.shapeB.surfaceVelocity;

        for (let i = 0; i < this.contactsCount; ++i) {
            const contact = this.contacts[i];

            Vector.subtract(contact.vertex, this.shapeA.body.position, contact.offsetA);
            Vector.subtract(contact.vertex, this.shapeB.body.position, contact.offsetB);

            const tangentCrossA = Vector.cross(contact.offsetA, this.tangent);
            const tangentCrossB = Vector.cross(contact.offsetB, this.tangent);
            contact.tangentShare = 1 / (this.pair.contactsCount * (
                this.pair.bodyA.inverseMass +
                this.pair.bodyB.inverseMass +
                this.pair.bodyA.inverseInertia * tangentCrossA * tangentCrossA +
                this.pair.bodyB.inverseInertia * tangentCrossB * tangentCrossB
            ));

            const normalCrossA = Vector.cross(contact.offsetA, this.normal);
            const normalCrossB = Vector.cross(contact.offsetB, this.normal);
            contact.normalShare = 1 / (this.pair.contactsCount * (
                this.pair.bodyA.inverseMass +
                this.pair.bodyB.inverseMass +
                this.pair.bodyA.inverseInertia * normalCrossA * normalCrossA +
                this.pair.bodyB.inverseInertia * normalCrossB * normalCrossB
            ));
            
        }

    }

}