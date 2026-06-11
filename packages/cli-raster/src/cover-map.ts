import fs from "node:fs/promises";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import fg from "fast-glob";

const execFileAsync = promisify(execFile);

const VECTOR_SVG_DIR = "./out/vector-only";
const OUTPUT_DIR = "./out/bottom-vector-map";

const INKSCAPE = "inkscape";
const GDAL_TRANSLATE = "gdal_translate";
const EXPORT_DPI = 600;

// This crop matches your AX31 vector-only file.
// Adjust here if needed.
const CROP = {
    x1: 51,
    y1: 1064,
    x2: 324,
    y2: 1473,
};

async function ensureDirs() {
    await fs.mkdir(OUTPUT_DIR, { recursive: true });
}

function baseKey(file: string) {
    return path
        .basename(file)
        .replace(/\.vector-only\.svg$/i, "");
}

async function vectorSvgCropToTiff(
    vectorSvgPath: string,
    outputTiff: string,
) {
    const tempPng = outputTiff.replace(/\.tif$/i, ".temp.png");

    await execFileAsync(INKSCAPE, [
        vectorSvgPath,
        "--export-type=png",
        `--export-dpi=${EXPORT_DPI}`,
        `--export-area=${CROP.x1}:${CROP.y1}:${CROP.x2}:${CROP.y2}`,
        `--export-filename=${tempPng}`,
    ]);

    await execFileAsync(GDAL_TRANSLATE, [
        "-of",
        "GTiff",
        "-co",
        "COMPRESS=LZW",
        "-co",
        "TILED=YES",
        tempPng,
        outputTiff,
    ]);

    await fs.rm(tempPng, { force: true });
}

async function main() {
    await ensureDirs();

    const vectorFiles = await fg(["*.vector-only.svg"], {
        cwd: VECTOR_SVG_DIR,
        absolute: true,
    });

    console.log(`Found vector-only SVG: ${vectorFiles.length}`);

    for (const vectorSvgPath of vectorFiles) {
        const key = baseKey(vectorSvgPath);

        const outputTiffPath = path.join(
            OUTPUT_DIR,
            `${key}.bottom-vector-map.tif`,
        );

        console.log(`\nProcessing ${key}`);

        await vectorSvgCropToTiff(
            vectorSvgPath,
            outputTiffPath,
        );

        console.log(`✓ ${outputTiffPath}`);
    }
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});