import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { parsePdfPagesFromExtractedContent } from "@/services/pdfExtract.service.js";
import { rasterizePdfPages } from "@/services/pdfPageImage.service.js";
import { pageIndexToUrl } from "@/animationPipeline/pipeline.types.js";
import { pdfAnimationScenePlanSchema } from "@/validators/pdfAnimationScene.schema.js";
import { validatePdfAnimationScenePlanAgainstSegments } from "@/validators/validatePdfAnimationScenePlan.js";
import type { AudioSegment } from "@/utils/segment.js";

const minimalPdf = `%PDF-1.1
1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj
2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj
3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 612 792]/Contents 5 0 R/Resources<</Font<</F1 4 0 R>>>>>>endobj
4 0 obj<</Type/Font/Subtype/Type1/BaseFont/Helvetica>>endobj
5 0 obj<</Length 68>>stream
BT /F1 24 Tf 72 720 Td (Phase 8 page one) Tj ET
endstream
endobj
xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000052 00000 n 
0000000101 00000 n 
0000000229 00000 n 
0000000295 00000 n 
trailer<</Size 6/Root 1 0 R>>
startxref
414
%%EOF
`;

const fail = (message: string) => {
    console.error(`FAIL: ${message}`);
    process.exitCode = 1;
};

const pass = (message: string) => {
    console.log(`PASS: ${message}`);
};

const extracted = `
--- Page 1 ---
Definition of Parliament

--- Page 2 ---
Powers of the Prime Minister
`;

const pages = parsePdfPagesFromExtractedContent(extracted);
if (pages.length !== 2 || pages[0]?.page !== 1 || pages[1]?.page !== 2) {
    fail(`parsePdfPages expected 2 pages, got ${JSON.stringify(pages)}`);
} else {
    pass("parsePdfPagesFromExtractedContent");
}

if (pageIndexToUrl(["u1", "u2"], 2) !== "u2") {
    fail("pageIndexToUrl page 2");
} else {
    pass("pageIndexToUrl");
}

const segments: AudioSegment[] = [
    { id: "segment_1", text: "Intro.", start: 0, end: 2.5 },
    { id: "segment_2", text: "Definition.", start: 2.5, end: 6 },
];

const validPlan = {
    scenes: [
        {
            id: "scene_1",
            page: 1,
            start: 0,
            end: 2.5,
            narrationSegments: ["segment_1"],
            animation: "none" as const,
            transition: "none" as const,
        },
        {
            id: "scene_2",
            page: 1,
            start: 2.5,
            end: 6,
            narrationSegments: ["segment_2"],
            animation: "zoom_in" as const,
            focus: { x: 0.1, y: 0.1, width: 0.5, height: 0.2 },
        },
    ],
};

const parsed = pdfAnimationScenePlanSchema.safeParse(validPlan);
if (!parsed.success) {
    fail(`valid plan rejected: ${parsed.error.message}`);
} else {
    try {
        validatePdfAnimationScenePlanAgainstSegments(parsed.data, segments, 2);
        pass("Zod + segment validation (valid plan)");
    } catch (err) {
        fail(`segment validation: ${String(err)}`);
    }
}

const inventedTime = {
    scenes: [
        {
            ...validPlan.scenes[0],
            start: 0.1,
            end: 2.5,
        },
        validPlan.scenes[1],
    ],
};
const inventedParsed = pdfAnimationScenePlanSchema.safeParse(inventedTime);
if (inventedParsed.success) {
    try {
        validatePdfAnimationScenePlanAgainstSegments(
            inventedParsed.data,
            segments,
            2
        );
        fail("invented timestamps were accepted");
    } catch {
        pass("invented timestamps rejected");
    }
} else {
    pass("invented timestamps rejected by Zod");
}

const badPage = pdfAnimationScenePlanSchema.safeParse({
    scenes: [{ ...validPlan.scenes[0], page: 9 }],
});
if (badPage.success) {
    fail("page 9 should be rejected");
} else {
    pass("invalid page index rejected");
}

try {
    const images = await rasterizePdfPages(Buffer.from(minimalPdf, "utf8"));
    if (images.length < 1 || images[0]!.pngBuffer.length < 100) {
        fail("rasterize produced empty PNG");
    } else {
        const tmp = path.join(os.tmpdir(), "lectureai-phase8-page1.png");
        await fs.writeFile(tmp, images[0]!.pngBuffer);
        pass(
            `rasterizePdfPages (${images[0]!.width}x${images[0]!.height}, wrote ${tmp})`
        );
    }
} catch (err) {
    fail(`rasterizePdfPages: ${err instanceof Error ? err.message : String(err)}`);
}

if (process.exitCode === 1) {
    console.error("Phase 8 smoke tests failed.");
    process.exit(1);
}

console.log("Phase 8 smoke tests passed.");
