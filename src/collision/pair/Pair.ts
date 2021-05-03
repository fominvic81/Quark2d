import { Shape } from '../../body/shapes/Shape';
import { Common } from '../../common/Common';
import { Vector } from '../../math/Vector';
import { Contact } from './Contact';

export class Pair {
    shapeA: Shape;
    shapeB: Shape;
    id: number;
    isActive: boolean = false;
    isActivePrev: boolean = false;
    friction: number = 0;
    restitution: number = 0;
    surfaceVelocity: number = 0;
    depth: number = 0;
    separation: number = 0;
    normal: Vector = new Vector();
    penetration: Vector = new Vector();
    contactsCount: number = 0;
    contacts: Contact[] = [new Contact(this), new Contact(this)];
    broadphaseCellsCount: number = 0;
    isSleeping: boolean = false;
    isSensor: boolean = false;

    constructor (shapeA: Shape, shapeB: Shape) {
        this.shapeA = shapeA;
        this.shapeB = shapeB;
        this.id = Common.combineId(this.shapeA.id, this.shapeB.id);
    }

    update () {
        this.normal.scale(this.depth, this.penetration);
        this.friction = Math.min(this.shapeA.friction, this.shapeB.friction);
        this.restitution = Math.max(this.shapeA.restitution, this.shapeB.restitution);
        this.surfaceVelocity = this.shapeA.surfaceVelocity + this.shapeB.surfaceVelocity;

        for (let i = 0; i < this.contactsCount; ++i) {
            const contact = this.contacts[i];

            contact.offsetA.x = contact.vertex.x - this.shapeA.body!.position.x;
            contact.offsetA.y = contact.vertex.y - this.shapeA.body!.position.y;
            contact.offsetB.x = contact.vertex.x - this.shapeB.body!.position.x;
            contact.offsetB.y = contact.vertex.y - this.shapeB.body!.position.y;

            const tangentCrossA = contact.offsetA.x * this.normal.x + contact.offsetA.y * this.normal.y;
            const tangentCrossB = contact.offsetB.x * this.normal.x + contact.offsetB.y * this.normal.y;
            contact.tangentShare = 1 / (this.contactsCount * (
                this.shapeA.body!.inverseMass +
                this.shapeB.body!.inverseMass +
                this.shapeA.body!.inverseInertia * tangentCrossA * tangentCrossA +
                this.shapeB.body!.inverseInertia * tangentCrossB * tangentCrossB
            ));

            const normalCrossA = contact.offsetA.x * this.normal.y - contact.offsetA.y * this.normal.x;
            const normalCrossB = contact.offsetB.x * this.normal.y - contact.offsetB.y * this.normal.x;
            contact.normalShare = 1 / (this.contactsCount * (
                this.shapeA.body!.inverseMass +
                this.shapeB.body!.inverseMass +
                this.shapeA.body!.inverseInertia * normalCrossA * normalCrossA +
                this.shapeB.body!.inverseInertia * normalCrossB * normalCrossB
            ));
            
        }
    }
}