import * as fs from "fs";
import * as fse from "fs-extra";
import * as path from "path";
import { Demopage } from "webpage-templates";


const data = {
    title: "Non-circular gears",
    description: "Non-circular gear generator",
    introduction: [
        "Gears are not always round. Non-circular gears were sketched by Leonardo da Vinci back in the 15th century. Such gears are designed to convert rotational speed in a nonconstant manner. They also look cool.",
        "This project is a non-circular gears system generator: the central gear in orange has a certain shape, and all the other gears in red are built to accomodate it. All of them have a fixed rotation axis.",
        "You can manually add more gears with the left mouse button, and delete existing gears with the right mouse button.",
    ],
    githubProjectName: "non-circular-gears",
    readme: {
        filepath: path.join(__dirname, "..", "README.md"),
        branchName: "main"
    },
    additionalLinks: [],
    styleFiles: [],
    scriptFiles: [
        "script/jsvaluenoise.min.js",
        "script/main.min.js"
    ],
    indicators: [],
    canvas: {
        width: 512,
        height: 512,
        enableFullscreen: true
    },
    controlsSections: [
        {
            title: "Engine",
            controls: [
                {
                    type: Demopage.supportedControls.Select,
                    title: "Central gear",
                    id: "central-gear-select-id",
                    placeholder: "<unknown>",
                    options: [
                        {
                            label: "Ellipse",
                            value: "ellipse",
                            checked: true,
                        },
                        {
                            label: "Heart",
                            value: "heart",
                        },
                        {
                            label: "Triangle",
                            value: "triangle",
                        },
                        {
                            label: "Square",
                            value: "square",
                        },
                        {
                            label: "Pentagon",
                            value: "pentagon",
                        },
                        {
                            label: "Random",
                            value: "random",
                        },
                        {
                            label: "Circle",
                            value: "circle",
                        },
                    ]
                },
                {
                    type: Demopage.supportedControls.Checkbox,
                    title: "Shift center",
                    id: "shift-center-checkbox-id",
                },
                {
                    type: Demopage.supportedControls.Range,
                    title: "Rotation speed",
                    id: "rotation-speed-range-id",
                    min: -1,
                    max: 1,
                    value: 0.3,
                    step: 0.05,
                },
                {
                    type: Demopage.supportedControls.Button,
                    id: "reset-button",
                    label: "Reset",
                },
                {
                    type: Demopage.supportedControls.Button,
                    id: "random-button",
                    label: "Randomize",
                },
            ]
        },
        {
            title:"Display",
            controls: [
                {
                    type: Demopage.supportedControls.Tabs,
                    title: "Style",
                    id: "display-style-tabs-id",
                    unique: true,
                    options: [
                        {
                            label: "Flat",
                            value: "flat",
                            checked: true,
                        },
                        {
                            label: "Outline",
                            value: "outline",
                        },
                    ]
                },
                {
                    type: Demopage.supportedControls.Checkbox,
                    title: "Show rays",
                    id: "show-rays-checkbox-id",
                    checked: true,
                },
                {
                    type: Demopage.supportedControls.Checkbox,
                    title: "Show teeth",
                    id: "show-teeth-checkbox-id",
                    checked: true,
                },
                {
                    type: Demopage.supportedControls.Tabs,
                    title: "Teeth size",
                    id: "teeth-size-tabs-id",
                    unique: true,
                    options: [
                        {
                            label: "Small",
                            value: "small",
                        },
                        {
                            label: "Medium",
                            value: "medium",
                            checked: true,
                        },
                        {
                            label: "Large",
                            value: "large",
                        },
                    ]
                },
                {
                    type: Demopage.supportedControls.Button,
                    id: "download-button",
                    label: "Download",
                },
            ]
        },
        {
            title: "3D Export",
            controls: [
                {
                    type: Demopage.supportedControls.Range,
                    title: "Gear thickness (mm)",
                    id: "gear-thickness-range-id",
                    min: 1,
                    max: 20,
                    value: 5,
                    step: 0.5,
                },
                {
                    type: Demopage.supportedControls.Range,
                    title: "Scale factor",
                    id: "scale-factor-range-id",
                    min: 100,
                    max: 2000,
                    value: 500,
                    step: 50,
                },
                {
                    type: Demopage.supportedControls.Range,
                    title: "Peg diameter (mm)",
                    id: "peg-diameter-range-id",
                    min: 2,
                    max: 15,
                    value: 5,
                    step: 0.5,
                },
                {
                    type: Demopage.supportedControls.Range,
                    title: "Hole clearance (mm)",
                    id: "hole-clearance-range-id",
                    min: 0,
                    max: 1,
                    value: 0.3,
                    step: 0.05,
                },
                {
                    type: Demopage.supportedControls.Range,
                    title: "Snap head overhang (mm)",
                    id: "snap-head-overhang-range-id",
                    min: 0.1,
                    max: 1.5,
                    value: 0.4,
                    step: 0.05,
                },
                {
                    type: Demopage.supportedControls.Range,
                    title: "Snap head height (mm)",
                    id: "snap-head-height-range-id",
                    min: 0.5,
                    max: 3,
                    value: 1.5,
                    step: 0.1,
                },
                {
                    type: Demopage.supportedControls.Range,
                    title: "Slit count",
                    id: "slit-count-range-id",
                    min: 2,
                    max: 6,
                    value: 4,
                    step: 1,
                },
                {
                    type: Demopage.supportedControls.Range,
                    title: "Slit width (mm)",
                    id: "slit-width-range-id",
                    min: 0.3,
                    max: 2,
                    value: 0.8,
                    step: 0.1,
                },
                {
                    type: Demopage.supportedControls.Range,
                    title: "Slit depth (mm)",
                    id: "slit-depth-range-id",
                    min: 1,
                    max: 8,
                    value: 3,
                    step: 0.5,
                },
                {
                    type: Demopage.supportedControls.Range,
                    title: "Chamfer depth (mm)",
                    id: "chamfer-depth-range-id",
                    min: 0.3,
                    max: 2,
                    value: 1,
                    step: 0.1,
                },
                {
                    type: Demopage.supportedControls.Range,
                    title: "Board thickness (mm)",
                    id: "board-thickness-range-id",
                    min: 1,
                    max: 10,
                    value: 3,
                    step: 0.5,
                },
                {
                    type: Demopage.supportedControls.Range,
                    title: "Board margin (mm)",
                    id: "board-margin-range-id",
                    min: 2,
                    max: 30,
                    value: 10,
                    step: 1,
                },
                {
                    type: Demopage.supportedControls.Button,
                    id: "download-stl-button",
                    label: "Download STL (ZIP)",
                },
            ]
        }
    ],
};

const SRC_DIR = path.resolve(__dirname);
const DEST_DIR = path.resolve(__dirname, "..", "docs");
const minified = true;

const buildResult = Demopage.build(data, DEST_DIR, {
    debug: !minified,
});

// disable linting on this file because it is generated
buildResult.pageScriptDeclaration = "/* tslint:disable */\n" + buildResult.pageScriptDeclaration;

const SCRIPT_DECLARATION_FILEPATH = path.join(SRC_DIR, "ts", "page-interface-generated.d.ts");
fs.writeFileSync(SCRIPT_DECLARATION_FILEPATH, buildResult.pageScriptDeclaration);

fse.copySync(path.resolve(SRC_DIR, "static"), DEST_DIR);
