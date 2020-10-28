import { Vector } from './Vector';
import { Decomp } from './Polydecomp';


export const Vertices = {};

Vertices.translate = (vertices, vector) => {

    for (let i = 0; i < vertices.length; i++) {
        Vector.add(vertices[i], vector);
    }

    return vertices;
};

Vertices.rotate = (vertices, angle, output = vertices) => {

    const cos = Math.cos(angle);
    const sin = Math.sin(angle);

    for (let i = 0; i < vertices.length; ++i) {
        const vertex = vertices[i];
        const outputVertex = output[i];
        const x = vertex.x;
        const y = vertex.y;
        outputVertex.x = x * cos - y * sin;
        outputVertex.y = x * sin + y * cos;
    }
    return output;
};

Vertices.scale = (vertices, scalar) => {
    for (let i = 0; i < vertices.length; i++) {
        Vector.scale(vertices[i], scalar);
    }

    return vertices;
}

Vertices.area = (vertices, signed = false) => {
    let area = 0;
    let j = vertices.length - 1;

    for (let i = 0; i < vertices.length; ++i) {
        area += (vertices[j].x - vertices[i].x) * (vertices[j].y + vertices[i].y);
        j = i;
    }

    return area / 2;
};

Vertices.inertia = (vertices) => {
    let numerator = 0;
    let denominator = 0;

    for (let i = 0; i < vertices.length; ++i) {
        const j = (i + 1) % vertices.length;
        const cross = Math.abs(
            Vector.cross(vertices[j],
            vertices[i])
        );
        numerator += cross * (
            Vector.dot(vertices[j], vertices[j]) +
            Vector.dot(vertices[j], vertices[i]) +
            Vector.dot(vertices[i], vertices[i])
        );
        denominator += cross;
    }

    return (numerator / denominator) / 6;
};

Vertices.center = (vertices) => {
    const center = new Vector();

    for (let i = 0; i < vertices.length; ++i) {
        const j = (i + 1) % vertices.length;
        const cross = Vector.cross(vertices[i], vertices[j]);
        const temp = Vector.scale(Vector.add(vertices[i], vertices[j], Vector.temp[0]), cross);
        Vector.add(center, temp);
    }

    Vector.divide(center, 6 * Vertices.area(vertices));

    return center;
}

Vertices.contains = (vertices, point) => {
    for (let i = 0; i < vertices.length; ++i) {
        const vertex = vertices[i];
        const nextVertex = vertices[(i + 1) % vertices.length];
        if ((point.x - vertex.x) * (nextVertex.y - vertex.y) + (point.y - vertex.y) * (vertex.x - nextVertex.x) > 0) {
            return false;
        }
    }

    return true;
};

Vertices.isConvex = (vertices) => {
    // http://paulbourke.net/geometry/polygonmesh/
    // Copyright (c) Paul Bourke (use permitted)
    let flag = 0;

    if (vertices.length < 3) {
        return null;
    }

    for (let i = 0; i < vertices.length; ++i) {
        const j = (i + 1) % vertices.length;
        const k = (i + 2) % vertices.length;

        const v1 = vertices[i];
        const v2 = vertices[j];
        const v3 = vertices[k];

        const cross = Vector.cross(Vector.subtract(v2, v1, Vector.temp[0]), Vector.subtract(v3, v1, Vector.temp[1]))

        if (cross < 0) {
            flag |= 1;
        } else if (cross > 0) {
            flag |= 2;
        }

        if (flag === 3) {
            return false;
        }
    }

    if (flag !== 0) {
        return true;
    } else {
        return null;
    }

}

Vertices.decomp = (vertices, removeCollinearPoints = true, minArea = 0) => {
    
    const poly = vertices.map((vertex) => [vertex.x, vertex.y]);
    Decomp.makeCCW(poly);

    if (Vertices.isConvex(vertices)) {
        const part = poly.map((vertex) => new Vector(vertex[0], vertex[1]));
        return [part];
    } else {
        
        const parts = [];
        const decomposed = Decomp.quickDecomp(poly);

        for (const p of decomposed) {
            if (removeCollinearPoints) {
                Decomp.removeCollinearPoints(p, 0.01);
            }
            const part = p.map((vertex) => new Vector(vertex[0], vertex[1]));
            if (Math.abs(Vertices.area(part)) > minArea) {
                parts.push(part);
            }
        }

        return parts;

    }
}