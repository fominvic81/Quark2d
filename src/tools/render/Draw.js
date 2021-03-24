import { Common } from '../../common/Common';


export const Draw = {};

Draw.rect = (ctx, position, width, height, angle, color, fill = true, lineWidth = 1) => {

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

Draw.circle = (ctx, position, radius, color, fill = true, lineWidth = 1) => {


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

Draw.roundedRect = (ctx, position, width, height, angle, round, color, fill = true, lineWidth = 1) => {

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

Draw.polygon = (ctx, polygon, color, fill = true, lineWidth = 1) => {

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

Draw.line = (ctx, start, end, color, width = 1) => {
    ctx.beginPath();

    ctx.moveTo(start.x, start.y);
    ctx.lineTo(end.x, end.y);

    ctx.closePath();

    ctx.lineWidth = width;
    ctx.strokeStyle = color;
    ctx.stroke();
}