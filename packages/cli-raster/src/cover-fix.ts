import fs from "node:fs/promises";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

const INPUT_DIR = "./eps";
const OUTPUT_DIR = "./out";

const fontMap: Record<string, string> = {
    "ATTriumvirateMou-CondBold": "NimbusSansNarrow-Bold",
    "ATTriumvirateMou-Cond": "NimbusSansNarrow-Regular",
};

const replacements: [RegExp, string][] = [
    // Orange: PANTONE 151 C -> light grey for the bottom cover title
    [
        /1\.00 \(PANTONE 151 C\) \[ 65\.0980 41\.0000 71\.0000\] \/DocLabSpace\s+create_spot_color set_solid_fill([\s\S]*?10\.04315 422\.31628 m[\s\S]*?@c\s*F)/g,
        "0 0 0 0.22 create_cmyk_color set_solid_fill$1",
    ],
    // Warm red if needed
    // [/0 0\.96 1 0 \(PANTONE Warm Red C\)/g, "0 0.85 0.9 0 (PANTONE Warm Red C)"],
];

function removeEmbeddedFont(eps: string, fontName: string): string {
    const pattern = new RegExp(
        `%%BeginResource: font ${fontName}[\\s\\S]*?%%EndResource\\s*`,
        "g"
    );

    return eps.replace(pattern, "");
}

async function processEps(fileName: string) {
    const inputPath = path.join(INPUT_DIR, fileName);
    const baseName = fileName.replace(/\.eps$/i, "");

    const outputEps = path.join(OUTPUT_DIR, `${baseName}.eps`);
    const outputPdf = path.join(OUTPUT_DIR, `${baseName}.pdf`);
    const outputSvg = path.join(OUTPUT_DIR, `${baseName}.svg`);

    let eps = await fs.readFile(inputPath, "latin1");

    eps = removeEmbeddedFont(eps, "ATTriumvirateMou-CondBold");
    eps = removeEmbeddedFont(eps, "ATTriumvirateMou-Cond");

    for (const [oldFont, newFont] of Object.entries(fontMap)) {
        const count = eps.split(oldFont).length - 1;
        console.log(`${fileName}: ${oldFont} matches after font removal = ${count}`);
        eps = eps.replaceAll(oldFont, newFont);
    }

    // Colour/text replacements
    for (const [from, to] of replacements) {
        const count = (eps.match(from) ?? []).length;
        console.log(`${fileName}: ${from} = ${count}`);
        eps = eps.replace(from, to);
    }

    await fs.writeFile(outputEps, eps, "latin1");

    try {
        await execFileAsync("gs", [
            "-dBATCH",
            "-dNOPAUSE",
            "-dSAFER",
            "-dEPSCrop",
            "-sDEVICE=pdfwrite",
            "-dPDFSETTINGS=/prepress",
            `-sOutputFile=${outputPdf}`,
            outputEps,
        ]);
    } catch (error) {
        console.error(`Error processing ${fileName} with Ghostscript:`, error);
    }

    await execFileAsync("inkscape", [
        outputPdf,
        "--export-type=svg",
        `--export-filename=${outputSvg}`,
    ]);

    console.log(`✓ ${fileName} -> ${outputPdf}`);
}

async function main() {
    await fs.mkdir(OUTPUT_DIR, { recursive: true });

    const files = await fs.readdir(INPUT_DIR);

    for (const file of files) {
        if (file.toLowerCase().endsWith(".eps")) {
            await processEps(file);
        }
    }
}

main().catch(console.error);