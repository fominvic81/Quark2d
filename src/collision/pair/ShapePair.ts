import { Shape } from '../../body/shapes/Shape';
import { Common } from '../../common/Common';
import { Vector } from '../../math/Vector';
import { Contact } from './Contact';
import { Pair } from './Pair';


export class ShapePair {
    shapeA: Shape;
    shapeB: Shape;
    pair: Pair;
    id: number;
    isActive: boolean = false;
    friction: number = 0;
    restitution: number = 0;
    surfaceVelocity: number = 0;
    depth: number = 0;
    separation: number = 0;
    normal: Vector = new Vector();
    tangent: Vector = new Vector();
    penetration: Vector = new Vector();
    contactsCount: number = 0;
    contacts: Array<Contact> = [new Contact(), new Contact()];
    isActiveBroadphase: boolean = false;
    broadphaseCellsCount: number = 0;

    constructor (shapeA: Shape, shapeB: Shape, pair: Pair) {
        this.shapeA = shapeA;
        this.shapeB = shapeB;
        this.pair = pair;
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