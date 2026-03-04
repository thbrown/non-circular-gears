/// <reference types="./page-interface-generated" />

const stlControlId = {
    GEAR_THICKNESS_RANGE: "gear-thickness-range-id",
    SCALE_FACTOR_RANGE: "scale-factor-range-id",
    PEG_DIAMETER_RANGE: "peg-diameter-range-id",
    HOLE_CLEARANCE_RANGE: "hole-clearance-range-id",
    SNAP_HEAD_OVERHANG_RANGE: "snap-head-overhang-range-id",
    SNAP_HEAD_HEIGHT_RANGE: "snap-head-height-range-id",
    SLIT_COUNT_RANGE: "slit-count-range-id",
    SLIT_WIDTH_RANGE: "slit-width-range-id",
    SLIT_DEPTH_RANGE: "slit-depth-range-id",
    CHAMFER_DEPTH_RANGE: "chamfer-depth-range-id",
    BOARD_THICKNESS_RANGE: "board-thickness-range-id",
    BOARD_MARGIN_RANGE: "board-margin-range-id",
    DOWNLOAD_STL_BUTTON: "download-stl-button",
};

function callCallbacks(callbacks: VoidFunction[]): void {
    for (const callback of callbacks) {
        callback();
    }
}

Page.Button.addObserver(stlControlId.DOWNLOAD_STL_BUTTON, () => {
    callCallbacks(StlParameters.onDownloadStl);
});

abstract class StlParameters {
    public static get gearThickness(): number {
        return Page.Range.getValue(stlControlId.GEAR_THICKNESS_RANGE);
    }
    public static get scaleFactor(): number {
        return Page.Range.getValue(stlControlId.SCALE_FACTOR_RANGE);
    }
    public static get pegDiameter(): number {
        return Page.Range.getValue(stlControlId.PEG_DIAMETER_RANGE);
    }
    public static get holeClearance(): number {
        return Page.Range.getValue(stlControlId.HOLE_CLEARANCE_RANGE);
    }
    public static get snapHeadOverhang(): number {
        return Page.Range.getValue(stlControlId.SNAP_HEAD_OVERHANG_RANGE);
    }
    public static get snapHeadHeight(): number {
        return Page.Range.getValue(stlControlId.SNAP_HEAD_HEIGHT_RANGE);
    }
    public static get slitCount(): number {
        return Page.Range.getValue(stlControlId.SLIT_COUNT_RANGE);
    }
    public static get slitWidth(): number {
        return Page.Range.getValue(stlControlId.SLIT_WIDTH_RANGE);
    }
    public static get slitDepth(): number {
        return Page.Range.getValue(stlControlId.SLIT_DEPTH_RANGE);
    }
    public static get chamferDepth(): number {
        return Page.Range.getValue(stlControlId.CHAMFER_DEPTH_RANGE);
    }
    public static get boardThickness(): number {
        return Page.Range.getValue(stlControlId.BOARD_THICKNESS_RANGE);
    }
    public static get boardMargin(): number {
        return Page.Range.getValue(stlControlId.BOARD_MARGIN_RANGE);
    }

    public static onDownloadStl: VoidFunction[] = [];
}

export { StlParameters };
