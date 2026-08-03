import fs from "node:fs/promises";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import execa from "execa";
import fg from "fast-glob";
import * as cheerio from "cheerio";

const execFileAsync = promisify(execFile);

const INPUT_DIR = "./eps";
const HILLSHADE_DIR = "./hillshade";
const OUTPUT_DIR = "./out";

const EPS_OUT_DIR = path.join(OUTPUT_DIR, "eps");
const PDF_OUT_DIR = path.join(OUTPUT_DIR, "pdf");
const SVG_OUT_DIR = path.join(OUTPUT_DIR, "svg");
const PNG_OUT_DIR = path.join(OUTPUT_DIR, "png");
const VECTOR_OUT_DIR = path.join(OUTPUT_DIR, "vector-only");

const GS = "gs";
const INKSCAPE = "inkscape";

// hillshade opacity
// 1.0 = original
// 0.6 = lighter
// 0.35 = very light
const IMAGE_OPACITY = 1.0;

// bottom/index orange box grey K value
// 0.30 = 30% black
// 0.18 = lighter grey
const INDEX_BOX_GREY_K = 0.30;

const fontMap: Record<string, string> = {
    "ATTriumvirateMou-CondBold": "NimbusSansNarrow-Bold",
    "ATTriumvirateMou-Cond": "NimbusSansNarrow-Regular",
};

const HILLSHADE_SUFFIXES = [
    "_hs.tif",
    "_hs.tiff",
    "_hillshade.tif",
    "_hillshade.tiff",
];

async function ensureDirs() {
    await fs.mkdir(EPS_OUT_DIR, { recursive: true });
    await fs.mkdir(PDF_OUT_DIR, { recursive: true });
    await fs.mkdir(SVG_OUT_DIR, { recursive: true });
    await fs.mkdir(PNG_OUT_DIR, { recursive: true });
    await fs.mkdir(VECTOR_OUT_DIR, { recursive: true });
}

function parseAndSplitEps(buffer: Buffer) {
    const isBinaryEps =
        buffer[0] === 0xc5 &&
        buffer[1] === 0xd0 &&
        buffer[2] === 0xd3 &&
        buffer[3] === 0xc6;

    if (!isBinaryEps) {
        return {
            psText: buffer.toString("latin1"),
            tiffBuffer: null as Buffer | null,
        };
    }

    const psStart = buffer.readUInt32LE(4);
    const psLength = buffer.readUInt32LE(8);
    const tiffStart = buffer.readUInt32LE(12);
    const tiffLength = buffer.readUInt32LE(16);

    const psText = buffer.subarray(psStart, psStart + psLength).toString("latin1");

    let tiffBuffer: Buffer | null = null;

    if (tiffLength > 0 && tiffStart > 0) {
        tiffBuffer = buffer.subarray(tiffStart, tiffStart + tiffLength);
    }

    return { psText, tiffBuffer };
}

function removeEmbeddedFont(eps: string, fontName: string): string {
    const pattern = new RegExp(
        `%%BeginResource: font ${fontName}[\\s\\S]*?%%EndResource\\s*`,
        "g",
    );

    return eps.replace(pattern, "");
}

function replaceFonts(eps: string, fileName: string): string {
    eps = removeEmbeddedFont(eps, "ATTriumvirateMou-CondBold");
    eps = removeEmbeddedFont(eps, "ATTriumvirateMou-Cond");

    for (const [oldFont, newFont] of Object.entries(fontMap)) {
        const count = eps.split(oldFont).length - 1;
        console.log(`${fileName}: ${oldFont} matches = ${count}`);
        eps = eps.replaceAll(oldFont, newFont);
    }

    return eps;
}

function replaceIndexOrangeBox(eps: string, fileName: string): string {
    const fillGrey = `0 0 0 ${INDEX_BOX_GREY_K.toFixed(2)} create_cmyk_color set_solid_fill`;

    let changed = 0;

    const result = eps.replace(
        /@rax %Note: Object[\s\S]*?(?=@rax %Note: Object|%%Trailer|$)/g,
        (block) => {
            const bbox = block.match(
                /([\d.]+)\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)\s+@E/,
            );

            if (!bbox) return block;

            const left = Number(bbox[1]);
            const bottom = Number(bbox[2]);
            const right = Number(bbox[3]);
            const top = Number(bbox[4]);

            const width = right - left;
            const height = top - bottom;

            const isIndexBox =
                width > 20 &&
                width < 220 &&
                height > 20 &&
                height < 260 &&
                bottom > 30 &&
                top < 420 &&
                block.includes("PANTONE 151 C");

            if (!isIndexBox) return block;

            changed++;

            console.log(
                `${fileName}: changed orange/index box bbox ${left}, ${bottom}, ${right}, ${top}`,
            );

            return block.replace(
                /[0-9.]+\s+\(PANTONE 151 C\)\s+\[\s*65\.0980\s+41\.0000\s+71\.0000\s*\]\s+\/DocLabSpace\s+create_spot_color set_solid_fill/g,
                fillGrey,
            );
        },
    );

    if (changed === 0) {
        console.warn(`${fileName}: no orange/index box changed`);
    }

    return result;
}

function safeName(file: string) {
    return path.basename(file, path.extname(file)).replace(/[^\w.-]+/g, "_");
}

function getSheetCode(file: string) {
    const base = path.basename(file, path.extname(file));
    const match = base.match(/[A-Z]{2}\d{2}/i);

    if (!match) {
        throw new Error(`Cannot find sheet code from filename: ${file}`);
    }

    return match[0].toLowerCase();
}

async function findHillshade(sheetCode: string) {
    for (const suffix of HILLSHADE_SUFFIXES) {
        const candidate = path.join(HILLSHADE_DIR, `${sheetCode}${suffix}`);

        try {
            await fs.access(candidate);
            return candidate;
        } catch {
            // try next
        }
    }

    const matches = await fg([`${sheetCode}*.tif`, `${sheetCode}*.tiff`], {
        cwd: HILLSHADE_DIR,
        absolute: true,
        caseSensitiveMatch: false,
    });

    return matches[0] ?? null;
}

async function epsToPdf(inputEps: string, outputPdf: string) {
    await execFileAsync(GS, [
        "-dBATCH",
        "-dNOPAUSE",
        "-dSAFER",
        "-dEPSCrop",
        "-sDEVICE=pdfwrite",
        "-dCompatibilityLevel=1.4",

        "-r600",
        "-dPDFSETTINGS=/prepress",
        "-dColorImageResolution=600",
        "-dGrayImageResolution=600",
        "-dMonoImageResolution=600",
        "-dColorImageDownsampleThreshold=1.0",
        "-dGrayImageDownsampleThreshold=1.0",

        "-dEmbedAllFonts=true",
        "-dSubsetFonts=false",

        `-sOutputFile=${outputPdf}`,
        inputEps,
    ]);
}

async function pdfToSvg(inputPdf: string, outputSvg: string) {
    await execFileAsync(INKSCAPE, [
        inputPdf,
        "--export-type=svg",
        "--export-dpi=600",
        `--export-filename=${outputSvg}`,
    ]);
}

async function createPngKeepOriginalColour(inputTif: string, outputPng: string) {
    await execa("gdal_translate", [
        "-of",
        "PNG",

        // no -scale, keeps hillshade colour/brightness
        inputTif,
        outputPng,
    ]);
}

function getImageTags(svgText: string) {
    return [...svgText.matchAll(/<image\b[\s\S]*?(?:\/>|<\/image>)/gi)];
}

async function replaceMainImageWithEmbeddedPng(
    svgPath: string,
    pngPath: string,
    outputSvg: string,
) {
    let svgText = await fs.readFile(svgPath, "utf8");

    const pngBuffer = await fs.readFile(pngPath);
    const embeddedPng = `data:image/png;base64,${pngBuffer.toString("base64")}`;

    const imageMatches = getImageTags(svgText);

    console.log(`Found <image>: ${imageMatches.length}`);

    if (imageMatches.length === 0) {
        throw new Error(`No <image> found in ${svgPath}`);
    }

    const firstMatch = imageMatches[0];
    const firstImage = firstMatch[0];

    let newFirstImage = firstImage
        .replace(/\s(?:xlink:)?href="[^"]*"/gi, "")
        .replace(/\spreserveAspectRatio="[^"]*"/gi, "")
        .replace(/\sopacity="[^"]*"/gi, "");

    if (newFirstImage.endsWith("/>")) {
        newFirstImage = newFirstImage.replace(
            /\s*\/>$/,
            ` href="${embeddedPng}" preserveAspectRatio="none" opacity="${IMAGE_OPACITY}" />`,
        );
    } else {
        newFirstImage = newFirstImage.replace(
            /<\/image>$/i,
            ` href="${embeddedPng}" preserveAspectRatio="none" opacity="${IMAGE_OPACITY}"></image>`,
        );
    }

    svgText =
        svgText.slice(0, firstMatch.index!) +
        newFirstImage +
        svgText.slice(firstMatch.index! + firstImage.length);

    const updatedImageMatches = getImageTags(svgText);

    for (let i = updatedImageMatches.length - 1; i >= 0; i--) {
        if (i === 0) continue;

        const match = updatedImageMatches[i];

        svgText =
            svgText.slice(0, match.index!) +
            "" +
            svgText.slice(match.index! + match[0].length);
    }

    await fs.writeFile(outputSvg, svgText, "utf8");

    const check = await fs.readFile(outputSvg, "utf8");

    console.log("Output contains embedded PNG:", check.includes("data:image/png;base64"));
    console.log("Output contains TIF:", check.includes(".tif") || check.includes(".tiff"));
    console.log("Output contains linked PNG:", check.includes(".png"));
}

async function writeVectorOnly(svgPath: string, outputSvg: string) {
    const svgText = await fs.readFile(svgPath, "utf8");
    const $ = cheerio.load(svgText, { xmlMode: true });

    $("image").remove();

    await fs.writeFile(outputSvg, $.xml());
}

async function processEps(fileName: string) {
    const inputPath = path.join(INPUT_DIR, fileName);
    const baseName = safeName(fileName);
    const sheetCode = getSheetCode(fileName);

    console.log(`\nProcessing: ${baseName}`);
    console.log(`Sheet code: ${sheetCode}`);

    const outputEps = path.join(EPS_OUT_DIR, `${baseName}.eps`);
    const outputPdf = path.join(PDF_OUT_DIR, `${baseName}.pdf`);
    const rawSvg = path.join(SVG_OUT_DIR, `${baseName}.raw.svg`);
    const finalSvg = path.join(SVG_OUT_DIR, `${baseName}.hillshade.svg`);
    const vectorOnlySvg = path.join(VECTOR_OUT_DIR, `${baseName}.vector-only.svg`);
    const pngHillshade = path.join(PNG_OUT_DIR, `${sheetCode}_hs_600dpi.png`);

    const inputBuffer = await fs.readFile(inputPath);
    const { psText } = parseAndSplitEps(inputBuffer);

    let eps = psText;

    eps = replaceFonts(eps, fileName);
    eps = replaceIndexOrangeBox(eps, fileName);

    await fs.writeFile(outputEps, eps, "latin1");

    await epsToPdf(outputEps, outputPdf);
    await pdfToSvg(outputPdf, rawSvg);

    const hillshadePath = await findHillshade(sheetCode);

    if (!hillshadePath) {
        console.warn(`${fileName}: no hillshade found, writing raw SVG only`);
        await fs.copyFile(rawSvg, finalSvg);
        await writeVectorOnly(rawSvg, vectorOnlySvg);
        return;
    }

    console.log(`Hillshade: ${hillshadePath}`);

    await createPngKeepOriginalColour(hillshadePath, pngHillshade);

    await replaceMainImageWithEmbeddedPng(
        rawSvg,
        pngHillshade,
        finalSvg,
    );

    await writeVectorOnly(rawSvg, vectorOnlySvg);

    console.log(`✓ EPS: ${outputEps}`);
    console.log(`✓ PDF: ${outputPdf}`);
    console.log(`✓ Raw SVG: ${rawSvg}`);
    console.log(`✓ Final SVG: ${finalSvg}`);
    console.log(`✓ Vector only: ${vectorOnlySvg}`);
    console.log(`✓ PNG: ${pngHillshade}`);
}

async function main() {
    await ensureDirs();

    const files = await fs.readdir(INPUT_DIR);

    for (const file of files) {
        if (file.toLowerCase().endsWith(".eps")) {
            await processEps(file);
        }
    }
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});