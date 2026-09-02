import fs from 'fs';
import { getDocument } from '../../frontend/node_modules/pdfjs-dist/legacy/build/pdf.mjs';

async function inspectPdf() {
  const pdfPath = 'C:/Users/S Prada/.gemini/antigravity/brain/1e974d42-1248-48ee-a307-674bf6c80bc5/.user_uploaded/media_1787484414949.pdf';
  const data = new Uint8Array(fs.readFileSync(pdfPath));
  const loadingTask = getDocument({ data });
  const pdfDocument = await loadingTask.promise;
  console.log(`PDF Pages: ${pdfDocument.numPages}`);

  for (let i = 1; i <= pdfDocument.numPages; i++) {
    const page = await pdfDocument.getPage(i);
    const content = await page.getTextContent();
    const strings = content.items.map(item => item.str);
    console.log(`--- Page ${i} ---`);
    console.log(strings.join(' '));
  }
}

inspectPdf().catch(console.error);
