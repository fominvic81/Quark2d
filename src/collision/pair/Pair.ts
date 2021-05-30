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
    depth: number = 0;
    separation: number = 0;
    normal: Vector = new Vector();
    penetration: Vector = new Vector();
    contactsCount: number = 0;
    contacts: Contact[] = [new Contact(this), new Contact(this)];
    broadphaseCellsCount: number = 0;
    isSleeping: boolean = false;
    isSensor: boolean = false;
    ratioA: number = 0;
    ratioB: number = 0;

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

        this.normal.scale(this.depth, this.penetration);
        this.surfaceVelocity = this.shapeA.surfaceVelocity + this.shapeB.surfaceVelocity;
        const share = 1 / (bodyA.inverseMass + bodyB.inverseMass);
        this.ratioA = share * bodyA.inverseMass;
        this.ratioB = share * bodyB.inverseMass;

        // relative velocity
        let rvX: number, rvY: number,
            normalVelocity: number,
            contact: Contact;

        for (let i = 0; i < this.contactsCount; ++i) {
            contact = this.contacts[i];

            contact.offsetA.x = contact.vertex.x - bodyA.center.x;
            contact.offsetA.y = contact.vertex.y - bodyA.center.y;
            contact.offsetB.x = contact.vertex.x - bodyB.center.x;
            contact.offsetB.y = contact.vertex.y - bodyB.center.y;

            const tangentCrossA = contact.offsetA.x * this.normal.x + contact.offsetA.y * this.normal.y;
            const tangentCrossB = contact.offsetB.x * this.normal.x + contact.offsetB.y * this.normal.y;
            contact.tangentShare = 1 / (this.contactsCount * (
                bodyA.inverseMass +
                bodyB.inverseMass +
                bodyA.inverseInertia * tangentCrossA * tangentCrossA +
                bodyB.inverseInertia * tangentCrossB * tangentCrossB
            ));

            const normalCrossA = contact.offsetA.x * this.normal.y - contact.offsetA.y * this.normal.x;
            const normalCrossB = contact.offsetB.x * this.normal.y - contact.offsetB.y * this.normal.x;
            contact.normalShare = 1 / (this.contactsCount * (
                bodyA.inverseMass +
                bodyB.inverseMass +
                bodyA.inverseInertia * normalCrossA * normalCrossA +
                bodyB.inverseInertia * normalCrossB * normalCrossB
            ));
            
            rvX = (bodyA.velocity.x - contact.offsetA.y * bodyA.angularVelocity) - (bodyB.velocity.x - contact.offsetB.y * bodyB.angularVelocity);
            rvY = (bodyA.velocity.y + contact.offsetA.x * bodyA.angularVelocity) - (bodyB.velocity.y + contact.offsetB.x * bodyB.angularVelocity);

            normalVelocity = this.normal.x * rvX + this.normal.y * rvY;

            if (normalVelocity > Settings.restitutionThreshold) contact.bias = normalVelocity * this.restitution; else contact.bias = 0;
        }
    }
}