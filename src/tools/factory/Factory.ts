import { FactoryShape } from './FactoryShape';
import { FactoryBody } from './FactoryBody';
import { FactoryComposite } from './FactoryComposite';

/**
 * Factory provides simple methods for creating bodies, shapes and composites.
 */

export class Factory {
    static Shape = FactoryShape;
    static Body = FactoryBody;
    static Composite = FactoryComposite;
}