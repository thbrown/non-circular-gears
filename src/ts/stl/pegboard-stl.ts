import type { Gear } from "../engine/gear";
import type { Point } from "../engine/point";
import type { Triangle } from "./stl-writer";
import type { Vec3 } from "./extrude";

interface PegboardOptions {
    scaleFactor: number;
    boardThickness: number;
    boardMargin: number;
    pegDiameter: number;
    gearThickness: number;
    snapHeadOverhang: number;
    snapHeadHeight: number;
    slitCount: number;
    slitWidth: number;
    slitDepth: number;
}

const PEG_SEGMENTS = 32; // segments per full circle for pegs

function buildPegboardStl(gears: Gear[], options: PegboardOptions): Triangle[] {
    const triangles: Triangle[] = [];

    // Get gear centers in mm
    const centers: Point[] = gears.map(g => ({
        x: g.center.x * options.scaleFactor,
        y: g.center.y * options.scaleFactor,
    }));

    // Compute bounding box
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const c of centers) {
        minX = Math.min(minX, c.x);
        minY = Math.min(minY, c.y);
        maxX = Math.max(maxX, c.x);
        maxY = Math.max(maxY, c.y);
    }
    minX -= options.boardMargin;
    minY -= options.boardMargin;
    maxX += options.boardMargin;
    maxY += options.boardMargin;

    // Build rectangular board
    buildBoard(triangles, minX, minY, maxX, maxY, options.boardThickness);

    // Build pegs at each gear center
    for (const center of centers) {
        buildSnapPeg(triangles, center, options);
    }

    return triangles;
}

function buildBoard(triangles: Triangle[], minX: number, minY: number, maxX: number, maxY: number, thickness: number): void {
    // Top face (z = thickness)
    const tl: Vec3 = { x: minX, y: maxY, z: thickness };
    const tr: Vec3 = { x: maxX, y: maxY, z: thickness };
    const br: Vec3 = { x: maxX, y: minY, z: thickness };
    const bl: Vec3 = { x: minX, y: minY, z: thickness };
    triangles.push({ normal: { x: 0, y: 0, z: 1 }, v1: tl, v2: br, v3: tr });
    triangles.push({ normal: { x: 0, y: 0, z: 1 }, v1: tl, v2: bl, v3: br });

    // Bottom face (z = 0)
    const tl0: Vec3 = { x: minX, y: maxY, z: 0 };
    const tr0: Vec3 = { x: maxX, y: maxY, z: 0 };
    const br0: Vec3 = { x: maxX, y: minY, z: 0 };
    const bl0: Vec3 = { x: minX, y: minY, z: 0 };
    triangles.push({ normal: { x: 0, y: 0, z: -1 }, v1: tl0, v2: tr0, v3: br0 });
    triangles.push({ normal: { x: 0, y: 0, z: -1 }, v1: tl0, v2: br0, v3: bl0 });

    // Front face (y = minY)
    triangles.push({ normal: { x: 0, y: -1, z: 0 }, v1: bl0, v2: br0, v3: br });
    triangles.push({ normal: { x: 0, y: -1, z: 0 }, v1: bl0, v2: br, v3: bl });

    // Back face (y = maxY)
    triangles.push({ normal: { x: 0, y: 1, z: 0 }, v1: tr0, v2: tl0, v3: tl });
    triangles.push({ normal: { x: 0, y: 1, z: 0 }, v1: tr0, v2: tl, v3: tr });

    // Left face (x = minX)
    triangles.push({ normal: { x: -1, y: 0, z: 0 }, v1: tl0, v2: bl0, v3: bl });
    triangles.push({ normal: { x: -1, y: 0, z: 0 }, v1: tl0, v2: bl, v3: tl });

    // Right face (x = maxX)
    triangles.push({ normal: { x: 1, y: 0, z: 0 }, v1: br0, v2: tr0, v3: tr });
    triangles.push({ normal: { x: 1, y: 0, z: 0 }, v1: br0, v2: tr, v3: br });
}

function buildSnapPeg(triangles: Triangle[], center: Point, options: PegboardOptions): void {
    const shaftRadius = options.pegDiameter / 2;
    const headRadius = shaftRadius + options.snapHeadOverhang;
    const pegHeight = options.gearThickness; // flush with gear top
    const shaftHeight = pegHeight - options.snapHeadHeight;
    const boardTop = options.boardThickness;

    const slitAngularWidth = options.slitWidth / shaftRadius; // angular width of each slit

    // Build peg as sectors separated by slits
    const sectorAngle = (Math.PI * 2) / options.slitCount;

    for (let s = 0; s < options.slitCount; s++) {
        const startAngle = s * sectorAngle + slitAngularWidth / 2;
        const endAngle = (s + 1) * sectorAngle - slitAngularWidth / 2;

        if (endAngle <= startAngle) continue;

        const segmentsPerSector = Math.max(4, Math.floor(PEG_SEGMENTS / options.slitCount));

        // Generate arc points for this sector
        const shaftArc = generateArcPoints(center.x, center.y, shaftRadius, startAngle, endAngle, segmentsPerSector);
        const headArc = generateArcPoints(center.x, center.y, headRadius, startAngle, endAngle, segmentsPerSector);

        // Shaft section: from boardTop to boardTop+shaftHeight
        // But slits extend down from top, so shaft below slit depth is solid
        const slitStartZ = boardTop + pegHeight - options.snapHeadHeight - options.slitDepth;
        const shaftBottomZ = boardTop;
        const shaftTopZ = boardTop + shaftHeight;
        const headBottomZ = shaftTopZ;
        const headTopZ = boardTop + pegHeight;

        // Lower shaft (below slits) - full cylinder
        if (slitStartZ > shaftBottomZ) {
            // This part is a full circle, but since we build sector by sector,
            // we just build each sector's portion
            buildSectorShell(triangles, center, shaftArc, shaftBottomZ, Math.min(slitStartZ, shaftTopZ));
        }

        // Upper shaft (within slits) - sector shape
        if (slitStartZ < shaftTopZ) {
            const upperShaftBottom = Math.max(slitStartZ, shaftBottomZ);
            buildSectorShell(triangles, center, shaftArc, upperShaftBottom, shaftTopZ);
            // Add slit walls (flat faces at sector edges)
            addSlitWall(triangles, center, shaftRadius, startAngle, upperShaftBottom, shaftTopZ);
            addSlitWall(triangles, center, shaftRadius, endAngle, upperShaftBottom, shaftTopZ);
        }

        // Snap head section - sector with larger radius
        buildSectorShell(triangles, center, headArc, headBottomZ, headTopZ);
        // Slit walls for head
        addSlitWall(triangles, center, headRadius, startAngle, headBottomZ, headTopZ);
        addSlitWall(triangles, center, headRadius, endAngle, headBottomZ, headTopZ);

        // Top cap of head
        buildSectorCap(triangles, center, headArc, headTopZ, true);

        // Bottom cap of shaft at board level
        buildSectorCap(triangles, center, shaftArc, shaftBottomZ, false);

        // Transition ring: shaft radius → head radius at shaftTopZ
        buildTransitionRing(triangles, shaftArc, headArc, shaftTopZ);
    }
}

function generateArcPoints(cx: number, cy: number, radius: number, startAngle: number, endAngle: number, segments: number): Point[] {
    const points: Point[] = [];
    for (let i = 0; i <= segments; i++) {
        const t = i / segments;
        const angle = startAngle + t * (endAngle - startAngle);
        points.push({
            x: cx + radius * Math.cos(angle),
            y: cy + radius * Math.sin(angle),
        });
    }
    return points;
}

function buildSectorShell(triangles: Triangle[], _center: Point, arcPoints: Point[], zBottom: number, zTop: number): void {
    // Outer curved wall
    for (let i = 0; i < arcPoints.length - 1; i++) {
        const curr = arcPoints[i]!;
        const next = arcPoints[i + 1]!;

        const dx = next.x - curr.x;
        const dy = next.y - curr.y;
        const len = Math.sqrt(dx * dx + dy * dy);
        if (len < 1e-10) continue;

        const nx = dy / len;
        const ny = -dx / len;
        const normal: Vec3 = { x: nx, y: ny, z: 0 };

        const bl: Vec3 = { x: curr.x, y: curr.y, z: zBottom };
        const br: Vec3 = { x: next.x, y: next.y, z: zBottom };
        const tl: Vec3 = { x: curr.x, y: curr.y, z: zTop };
        const tr: Vec3 = { x: next.x, y: next.y, z: zTop };

        triangles.push({ normal, v1: bl, v2: br, v3: tr });
        triangles.push({ normal, v1: bl, v2: tr, v3: tl });
    }
}

function addSlitWall(triangles: Triangle[], center: Point, radius: number, angle: number, zBottom: number, zTop: number): void {
    const outerX = center.x + radius * Math.cos(angle);
    const outerY = center.y + radius * Math.sin(angle);

    // Normal perpendicular to the radial direction (tangential)
    // For the slit wall, the normal faces into the slit gap
    const radX = Math.cos(angle);
    const radY = Math.sin(angle);
    // Cross product with Z to get tangent; we need to determine direction
    // We'll use a simple perpendicular
    const nx = -radY;
    const ny = radX;
    const normal: Vec3 = { x: nx, y: ny, z: 0 };

    const ci: Vec3 = { x: center.x, y: center.y, z: zBottom };
    const co: Vec3 = { x: outerX, y: outerY, z: zBottom };
    const cit: Vec3 = { x: center.x, y: center.y, z: zTop };
    const cot: Vec3 = { x: outerX, y: outerY, z: zTop };

    triangles.push({ normal, v1: ci, v2: co, v3: cot });
    triangles.push({ normal, v1: ci, v2: cot, v3: cit });
}

function buildSectorCap(triangles: Triangle[], center: Point, arcPoints: Point[], z: number, topFacing: boolean): void {
    const normal: Vec3 = topFacing ? { x: 0, y: 0, z: 1 } : { x: 0, y: 0, z: -1 };
    const c: Vec3 = { x: center.x, y: center.y, z };

    for (let i = 0; i < arcPoints.length - 1; i++) {
        const p1 = arcPoints[i]!;
        const p2 = arcPoints[i + 1]!;

        const v1: Vec3 = { x: p1.x, y: p1.y, z };
        const v2: Vec3 = { x: p2.x, y: p2.y, z };

        if (topFacing) {
            triangles.push({ normal, v1: c, v2: v1, v3: v2 });
        } else {
            triangles.push({ normal, v1: c, v2: v2, v3: v1 });
        }
    }
}

function buildTransitionRing(triangles: Triangle[], innerArc: Point[], outerArc: Point[], z: number): void {
    const normal: Vec3 = { x: 0, y: 0, z: 1 }; // top-facing ring at transition

    const count = Math.min(innerArc.length, outerArc.length);
    for (let i = 0; i < count - 1; i++) {
        const iCurr = innerArc[i]!;
        const iNext = innerArc[i + 1]!;
        const oCurr = outerArc[i]!;
        const oNext = outerArc[i + 1]!;

        triangles.push({
            normal,
            v1: { x: iCurr.x, y: iCurr.y, z },
            v2: { x: oCurr.x, y: oCurr.y, z },
            v3: { x: oNext.x, y: oNext.y, z },
        });
        triangles.push({
            normal,
            v1: { x: iCurr.x, y: iCurr.y, z },
            v2: { x: oNext.x, y: oNext.y, z },
            v3: { x: iNext.x, y: iNext.y, z },
        });
    }
}

export { buildPegboardStl };
export type { PegboardOptions };
