import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const pdf = `%PDF-1.1
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

const file = path.join(os.tmpdir(), "lectureai-phase8.pdf");
fs.writeFileSync(file, pdf);

const buf = fs.readFileSync(file);
const form = new FormData();
form.append(
    "pdf",
    new Blob([buf], { type: "application/pdf" }),
    "phase8-test.pdf"
);

const res = await fetch("http://localhost:3000/api/pdf/extract", {
    method: "POST",
    body: form,
});

const json = (await res.json()) as {
    success?: boolean;
    message?: string;
    data?: { lectureId?: string; content?: string };
    error?: unknown;
};

console.log(
    JSON.stringify(
        {
            status: res.status,
            success: json.success,
            message: json.message,
            lectureId: json.data?.lectureId,
            contentPreview: String(json.data?.content ?? "").slice(0, 160),
            error: json.error,
        },
        null,
        2
    )
);

if (!res.ok || !json.success || !json.data?.lectureId) {
    process.exit(1);
}
