import { Body } from '../../body/Body';
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
    tangent: Vector = new Vector();
    penetration: Vector = new Vector();
    contactsCount: number = 0;
    contacts: Contact[] = [new Contact(this), new Contact(this)];
    broadphaseCellsCount: number = 0;
    isSleeping: boolean = false;

    constructor (shapeA: Shape, shapeB: Shape) {
        this.shapeA = shapeA;
        this.shapeB = shapeB;
        this.id = Common.combineId(this.shapeA.id, this.shapeB.id);
    }

    update () {
        this.normal.scale(this.depth, this.penetration);
        this.normal.rotate90(this.tangent);
        this.friction = Math.min(this.shapeA.friction, this.shapeB.friction);
        this.restitution = Math.max(this.shapeA.restitution, this.shapeB.restitution);
        this.surfaceVelocity = this.shapeA.surfaceVelocity + this.shapeB.surfaceVelocity;

        for (let i = 0; i < this.contactsCount; ++i) {
            const contact = this.contacts[i];

            Vector.subtract(contact.vertex, (<Body>this.shapeA.body).position, contact.offsetA);
            Vector.subtract(contact.vertex, (<Body>this.shapeB.body).position, contact.offsetB);

            const tangentCrossA = Vector.cross(contact.offsetA, this.tangent);
            const tangentCrossB = Vector.cross(contact.offsetB, this.tangent);
            contact.tangentShare = 1 / (this.contactsCount * (
                (<Body>this.shapeA.body).inverseMass +
                (<Body>this.shapeB.body).inverseMass +
                (<Body>this.shapeA.body).inverseInertia * tangentCrossA * tangentCrossA +
                (<Body>this.shapeB.body).inverseInertia * tangentCrossB * tangentCrossB
            ));

            const normalCrossA = Vector.cross(contact.offsetA, this.normal);
            const normalCrossB = Vector.cross(contact.offsetB, this.normal);
            contact.normalShare = 1 / (this.contactsCount * (
                (<Body>this.shapeA.body).inverseMass +
                (<Body>this.shapeB.body).inverseMass +
                (<Body>this.shapeA.body).inverseInertia * normalCrossA * normalCrossA +
                (<Body>this.shapeB.body).inverseInertia * normalCrossB * normalCrossB
            ));
            
        }
    }
}