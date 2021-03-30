import { Common } from '../../common/Common';
import { Vector } from '../../math/Vector';


export class Draw {

    static rect = (ctx: CanvasRenderingContext2D, position: Vector, width: number, height: number, angle: number, color: string, fill: boolean = true, lineWidth: number = 1) => {

        if (angle && Math.abs(angle % Common.PI05) > 0.025) {
            ctx.save();
            ctx.translate(position.x, position.y);

            ctx.rotate(angle);

            if (fill) {
                ctx.fillStyle = color;
                ctx.fillRect(-width * 0.5, -height * 0.5, width, height);
            } else {
                ctx.strokeStyle = color;
                ctx.lineWidth = lineWidth;
                ctx.strokeRect(-width * 0.5, -height * 0.5, width, height);
            }
            ctx.restore();
        } else {
            if (fill) {
                ctx.fillStyle = color;
                ctx.fillRect(position.x - width * 0.5, position.y - height * 0.5, width, height);
            } else {
                ctx.strokeStyle = color;
                ctx.lineWidth = lineWidth;
                ctx.strokeRect(position.x - width * 0.5, position.y - height * 0.5, width, height);
            }
        }
    }

    static circle = (ctx: CanvasRenderingContext2D, position: Vector, radius: number, color: string, fill: boolean = true, lineWidth: number = 1) => {


        ctx.beginPath();
        ctx.arc(position.x, position.y, radius, 0, Common.PI2);

        if (fill) {
            ctx.fillStyle = color;
            ctx.fill();
        } else {
            ctx.lineWidth = lineWidth;
            ctx.strokeStyle = color;
            ctx.stroke();
        }

        ctx.closePath();

    }

    static roundedRect = (ctx: CanvasRenderingContext2D, position: Vector, width: number, height: number, angle: number, round: number, color: string, fill: boolean = true, lineWidth: number = 1) => {

        if (!round) {
            Draw.rect(ctx, position, width, height, angle, color, fill, lineWidth);
        }

        ctx.save();
        ctx.translate(position.x, position.y);
        if (angle) ctx.rotate(angle);


        const halfWidth = width * 0.5;
        const halfHeight = height * 0.5;
        const halfMin = Math.min(halfWidth, halfHeight);;

        round = Math.min(Math.max(round, 0), 1);
        const radius = halfMin * round;
        
        ctx.beginPath();
        ctx.moveTo(-halfWidth, -halfHeight + radius);
        ctx.arcTo(-halfWidth, -halfHeight, -halfWidth + radius, -halfHeight, radius);
        ctx.moveTo(halfWidth - radius, -halfHeight);
        ctx.arcTo(halfWidth, -halfHeight, halfWidth, -halfHeight + radius, radius);
        ctx.moveTo(halfWidth, halfHeight - radius);
        ctx.arcTo(halfWidth, halfHeight, halfWidth - radius, halfHeight, radius);
        ctx.moveTo(-halfWidth + radius, halfHeight);
        ctx.arcTo(-halfWidth, halfHeight, -halfWidth, halfHeight - radius, radius);

        ctx.moveTo(-halfWidth, -halfHeight + radius);
        ctx.lineTo(-halfWidth + radius, -halfHeight);
        ctx.lineTo(halfWidth - radius, -halfHeight);
        ctx.lineTo(halfWidth, -halfHeight + radius);
        ctx.lineTo(halfWidth, halfHeight - radius);
        ctx.lineTo(halfWidth - radius, halfHeight);
        ctx.lineTo(-halfWidth + radius, halfHeight);
        ctx.lineTo(-halfWidth, halfHeight - radius);
        ctx.lineTo(-halfWidth, -halfHeight + radius);

        ctx.closePath();

        if (fill) {
            ctx.fillStyle = color;
            ctx.fill();
        } else {
            ctx.lineWidth = lineWidth;
            ctx.strokeStyle = color;
            ctx.stroke();
        }

        ctx.restore();
    }

    static polygon = (ctx: CanvasRenderingContext2D, polygon: Array<Vector>, color: string, fill: boolean = true, lineWidth: number = 1) => {

        ctx.beginPath();

        ctx.moveTo(polygon[0].x, polygon[0].y);
        for (let i = 0; i < polygon.length; ++i) {
            ctx.lineTo(polygon[i].x, polygon[i].y);
        }
        ctx.lineTo(polygon[0].x, polygon[0].y);

        ctx.closePath();

        if (fill) {
            ctx.fillStyle = color;
            ctx.fill();
        } else {
            ctx.lineWidth = lineWidth;
            ctx.strokeStyle = color;
            ctx.stroke();
        }

    }

    static line = (ctx: CanvasRenderingContext2D, start: Vector, end: Vector, color: string, width: number = 1) => {
        ctx.beginPath();

        ctx.moveTo(start.x, start.y);
        ctx.lineTo(end.x, end.y);

        ctx.closePath();

        ctx.lineWidth = width;
        ctx.strokeStyle = color;
        ctx.stroke();
    }
}