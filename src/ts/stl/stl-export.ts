import JSZip from "jszip";
import type { Scene } from "../scenes/scene";
import { StlParameters } from "../stl-parameters";
import { buildGearStl } from "./gear-stl";
import { buildPegboardStl } from "./pegboard-stl";
import { buildStlBuffer } from "./stl-writer";

function downloadBlob(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

async function exportStlZip(scene: Scene): Promise<void> {
    const gears = scene.allGears;
    const zip = new JSZip();

    const gearThickness = StlParameters.gearThickness;
    const scaleFactor = StlParameters.scaleFactor;
    const pegDiameter = StlParameters.pegDiameter;
    const holeClearance = StlParameters.holeClearance;
    const snapHeadOverhang = StlParameters.snapHeadOverhang;
    const snapHeadHeight = StlParameters.snapHeadHeight;
    const chamferDepth = StlParameters.chamferDepth;

    // Generate individual gear STLs
    for (let i = 0; i < gears.length; i++) {
        const gear = gears[i]!;
        const gearTriangles = buildGearStl(gear, {
            thickness: gearThickness,
            scaleFactor,
            pegDiameter,
            holeClearance,
            snapHeadOverhang,
            chamferDepth,
            chamferClearance: 0.2,
            idealToothSize: 0.04,
        });
        const buffer = buildStlBuffer(gearTriangles);
        zip.file(`gear-${i}.stl`, buffer);
    }

    // Generate pegboard STL
    const pegboardTriangles = buildPegboardStl(gears, {
        scaleFactor,
        boardThickness: StlParameters.boardThickness,
        boardMargin: StlParameters.boardMargin,
        pegDiameter,
        gearThickness,
        snapHeadOverhang,
        snapHeadHeight,
        slitCount: StlParameters.slitCount,
        slitWidth: StlParameters.slitWidth,
        slitDepth: StlParameters.slitDepth,
    });
    const pegboardBuffer = buildStlBuffer(pegboardTriangles);
    zip.file("pegboard.stl", pegboardBuffer);

    // Generate and download zip
    const blob = await zip.generateAsync({ type: "blob" });
    downloadBlob(blob, "non-circular-gears.zip");
}

export { exportStlZip };
