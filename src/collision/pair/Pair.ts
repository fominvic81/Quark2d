import { Shape } from '../../body/shapes/Shape';
import { Common } from '../../common/Common';
import { Vector } from '../../math/Vector';
import { Settings } from '../../Settings';
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
    normal: Vector = new Vector();
    contactsCount: number = 0;
    contacts: Contact[] = [new Contact(this), new Contact(this)];
    broadphaseCellsCount: number = 0;
    isSleeping: boolean = false;
    isSensor: boolean = false;

    constructor (shapeA: Shape, shapeB: Shape) {
        this.shapeA = shapeA;
        this.shapeB = shapeB;
        this.id = Common.combineId(this.shapeA.id, this.shapeB.id);

        this.friction = Math.sqrt(this.shapeA.friction * this.shapeB.friction);
        this.restitution = Math.max(this.shapeA.restitution, this.shapeB.restitution);
    }

    update () {
        const bodyA = this.shapeA.body!;
        const bodyB = this.shapeB.body!;

        this.surfaceVelocity = this.shapeA.surfaceVelocity + this.shapeB.surfaceVelocity;

        let normalVelocity: number,
            contact: Contact;

        for (let i = 0; i < this.contactsCount; ++i) {
            contact = this.contacts[i];

            contact.offsetA.x = contact.vertex.x - bodyA.center.x;
            contact.offsetA.y = contact.vertex.y - bodyA.center.y;
            contact.offsetB.x = contact.vertex.x - bodyB.center.x;
            contact.offsetB.y = contact.vertex.y - bodyB.center.y;

            const tangentCrossA = contact.offsetA.x * this.normal.x + contact.offsetA.y * this.normal.y;
            const tangentCrossB = contact.offsetB.x * this.normal.x + contact.offsetB.y * this.normal.y;
            contact.tangentShare = 1 / (
                bodyA.inverseMass +
                bodyB.inverseMass +
                bodyA.inverseInertia * tangentCrossA * tangentCrossA +
                bodyB.inverseInertia * tangentCrossB * tangentCrossB
            );

            const normalCrossA = contact.offsetA.x * this.normal.y - contact.offsetA.y * this.normal.x;
            const normalCrossB = contact.offsetB.x * this.normal.y - contact.offsetB.y * this.normal.x;
            contact.normalShare = 1 / (
                bodyA.inverseMass +
                bodyB.inverseMass +
                bodyA.inverseInertia * normalCrossA * normalCrossA +
                bodyB.inverseInertia * normalCrossB * normalCrossB
            );

            contact.positionBias = contact.depth * Settings.depthDamping;
            contact.positionImpulse = 0;

            contact.relativeVelocity.x = (bodyB.velocity.x - contact.offsetB.y * bodyB.angularVelocity) - (bodyA.velocity.x - contact.offsetA.y * bodyA.angularVelocity);
            contact.relativeVelocity.y = (bodyB.velocity.y + contact.offsetB.x * bodyB.angularVelocity) - (bodyA.velocity.y + contact.offsetA.x * bodyA.angularVelocity);

            contact.normalVelocity = this.normal.x * contact.relativeVelocity.x + this.normal.y * contact.relativeVelocity.y;

            if (contact.normalVelocity < -Settings.restitutionThreshold) contact.bias = contact.normalVelocity * this.restitution; else contact.bias = 0;
        }
    }
}