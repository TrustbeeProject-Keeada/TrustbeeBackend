import PDFDocument from "pdfkit";

export interface PdfSection {
  heading: string;
  /**
   * Each paragraph supports the format:
   *   "Title\nSubtitle, Location\n- Bullet 1\n- Bullet 2 | Date Range"
   * - First line rendered in accent color (role/degree title)
   * - Subsequent non-bullet lines rendered in body color (org name, location)
   * - Lines starting with "- " are rendered as bullet points
   * - Text after " | " is the date range, right-aligned
   */
  paragraphs?: string[];
  /** Flat bullet list — for languages, certifications, etc. */
  bullets?: string[];
  /**
   * Divider-separated single lines — used for skills.
   * Each line is separated by a full-width rule above and below.
   */
  dividerLines?: string[];
}

export interface CvStructure {
  /** Intentionally omitted — the CV is anonymous. Do not populate. */
  fullName?: string;
  headline?: string;
  preferredFont?: string;
  contactInfo: {
    email: string;
    phone: string;
    location?: string | null;
  };
  professionalSummary?: string;
  sections: PdfSection[];
  footer?: string;
}

export async function buildCvPdf(structure: CvStructure): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      // ── Design tokens ──────────────────────────────────────────────────────
      const PAGE_MARGIN = 50;
      const ACCENT  = "#b36a3c"; // terracotta
      const TEXT    = "#1a1a1a"; // near-black body
      const MUTED   = "#5a5a5a"; // secondary / meta text
      const DIVIDER = "#d7d2cc"; // soft warm divider

      const selectFonts = (preferred?: string) => {
        const n = (preferred || "").trim().toLowerCase();
        if (["calibri", "arial", "helvetica", "sans"].includes(n)) {
          return {
            displaySerif:      "Helvetica-Bold",
            displaySerifLight: "Helvetica",
            bodyRegular:       "Helvetica",
            bodyBold:          "Helvetica-Bold",
          };
        }
        return {
          displaySerif:      "Times-Bold",    // section headings
          displaySerifLight: "Times-Roman",   // headline under contact
          bodyRegular:       "Helvetica",
          bodyBold:          "Helvetica-Bold",
        };
      };

      const F = selectFonts(structure.preferredFont);

      const doc = new PDFDocument({ margin: PAGE_MARGIN, bufferPages: true, size: "A4" });

      const PAGE_W   = doc.page.width;
      const CONTENT_W = PAGE_W - PAGE_MARGIN * 2;
      const RIGHT_X  = PAGE_W - PAGE_MARGIN;

      const chunks: Buffer[] = [];
      doc.on("data",  (c: Buffer) => chunks.push(c));
      doc.on("end",   () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);

      // ── Helpers ────────────────────────────────────────────────────────────
      const hr = (color = DIVIDER, weight = 0.75) => {
        const y = doc.y;
        doc.strokeColor(color).lineWidth(weight)
           .moveTo(PAGE_MARGIN, y).lineTo(RIGHT_X, y).stroke();
        doc.strokeColor(TEXT).lineWidth(1);
        doc.y = y + 1;
      };

      const ensureSpace = (needed: number) => {
        if (doc.y + needed > doc.page.height - PAGE_MARGIN - 20) doc.addPage();
      };

      const isBulletLine = (line: string) => /^[-*•–]\s+/.test(line);
      const stripBullet  = (line: string) => line.replace(/^[-*•–]\s+/, "");

      /** Render one entry row: left stacked lines + optional right-aligned date. */
      const renderEntryRow = (
        leftLines: { text: string; color: string; size?: number }[],
        rightText?: string,
      ) => {
        ensureSpace(40);
        const startY    = doc.y;
        const rightSize = 10.5;

        if (rightText) {
          doc.font(F.bodyRegular).fontSize(rightSize).fillColor(MUTED);
          const w = doc.widthOfString(rightText);
          doc.text(rightText, RIGHT_X - w, startY, { lineBreak: false });
        }

        let y = startY;
        for (const line of leftLines) {
          doc.font(F.bodyRegular).fontSize(line.size ?? 11).fillColor(line.color);
          const maxW = y === startY && rightText
            ? CONTENT_W - doc.widthOfString(rightText) - 12
            : CONTENT_W;
          doc.text(line.text, PAGE_MARGIN, y, { width: maxW, lineBreak: false });
          y += (line.size ?? 11) * 1.3;
        }

        doc.y = y;
      };

      const renderBullets = (bullets: string[]) => {
        if (!bullets?.length) return;
        doc.moveDown(0.15);
        for (const bullet of bullets) {
          ensureSpace(20);
          const y = doc.y;
          doc.font(F.bodyRegular).fontSize(11).fillColor(TEXT)
             .text("•", PAGE_MARGIN + 6, y, { lineBreak: false });
          doc.text(bullet, PAGE_MARGIN + 20, y, { width: CONTENT_W - 20, align: "left", lineGap: 2 });
          doc.moveDown(0.25);
        }
      };

      // ── HEADER (anonymous: headline left, contact right) ───────────────────
      const headerStartY = doc.y;

      // Headline / job title — left side, accent, large serif
      if (structure.headline) {
        doc.font(F.displaySerif).fontSize(26).fillColor(ACCENT)
           .text(structure.headline, PAGE_MARGIN, headerStartY, {
             lineBreak: false,
             width: CONTENT_W * 0.58,
           });
      }

      // Contact info — right side, two lines, accent
      const contactLine1 = [structure.contactInfo.email, structure.contactInfo.phone]
        .filter(Boolean).join("  •  ");
      const contactLine2 = structure.contactInfo.location || "";

      doc.font(F.bodyRegular).fontSize(10.5).fillColor(ACCENT)
         .text(contactLine1, PAGE_MARGIN, headerStartY + 4, {
           width: CONTENT_W, align: "right", lineBreak: false,
         });

      if (contactLine2) {
        doc.font(F.bodyRegular).fontSize(10.5).fillColor(ACCENT)
           .text(contactLine2, PAGE_MARGIN, headerStartY + 20, {
             width: CONTENT_W, align: "right", lineBreak: false,
           });
      }

      // Move past header block
      doc.y = headerStartY + (structure.headline ? 46 : 36);
      doc.moveDown(0.7);

      // ── PROFESSIONAL SUMMARY ───────────────────────────────────────────────
      if (structure.professionalSummary) {
        doc.font(F.bodyRegular).fontSize(11).fillColor(TEXT)
           .text(structure.professionalSummary, PAGE_MARGIN, doc.y, {
             width: CONTENT_W, align: "left", lineGap: 3,
           });
        doc.moveDown(1.3);
      }

      // ── SECTIONS ──────────────────────────────────────────────────────────
      for (const section of structure.sections) {
        ensureSpace(80);

        // Section heading — large serif, accent
        doc.font(F.displaySerif).fontSize(20).fillColor(ACCENT)
           .text(section.heading, PAGE_MARGIN, doc.y, { width: CONTENT_W, lineBreak: false });
        doc.moveDown(0.35);

        // ── Paragraphed entries (work experience, education) ─────────────────
        if (section.paragraphs?.length) {
          for (let i = 0; i < section.paragraphs.length; i++) {
            const para = section.paragraphs[i];
            const parts    = para.split("|").map((s) => s.trim());
            const leftRaw  = parts[0];
            const rightText = parts.slice(1).join(" | ") || undefined;

            const allLeftLines = leftRaw.split("\n").map((s) => s.trim()).filter(Boolean);
            const firstBullet  = allLeftLines.findIndex(isBulletLine);
            const entryLines   = firstBullet >= 0 ? allLeftLines.slice(0, firstBullet) : allLeftLines;
            const bulletLines  = firstBullet >= 0 ? allLeftLines.slice(firstBullet).map(stripBullet).filter(Boolean) : [];

            // Map entry lines: first is accent (title), rest are body (org/location)
            const styledLines = entryLines.map((text, idx) => ({
              text,
              color: idx === 0 ? ACCENT : TEXT,
              size: idx === 0 ? 11.5 : 11,
            }));

            if (styledLines.length) renderEntryRow(styledLines, rightText);
            if (bulletLines.length) renderBullets(bulletLines);

            // Divider between entries (not after the last one)
            if (i < section.paragraphs.length - 1) {
              doc.moveDown(0.5);
              hr();
              doc.moveDown(0.5);
            } else {
              doc.moveDown(0.4);
            }
          }
        }

        // ── Flat bullets (languages, certifications, etc.) ──────────────────
        if (section.bullets?.length) {
          renderBullets(section.bullets);
        }

        // ── Divider-separated skill lines ────────────────────────────────────
        if (section.dividerLines?.length) {
          hr();
          doc.moveDown(0.45);
          for (const line of section.dividerLines) {
            ensureSpace(28);
            doc.font(F.bodyRegular).fontSize(11).fillColor(TEXT)
               .text(line, PAGE_MARGIN, doc.y, { width: CONTENT_W, lineBreak: false });
            doc.moveDown(0.55);
            hr();
            doc.moveDown(0.45);
          }
        }

        doc.moveDown(0.9);
      }

      // ── FOOTER — page numbers on every page ────────────────────────────────
      const range      = doc.bufferedPageRange();
      const totalPages = range.count;
      for (let i = 0; i < totalPages; i++) {
        doc.switchToPage(range.start + i);
        const footerY = doc.page.height - PAGE_MARGIN / 2 - 6;
        const label   = `Page ${i + 1} | ${totalPages}`;

        doc.font(F.bodyRegular).fontSize(9).fillColor(MUTED)
           .text(label, PAGE_MARGIN, footerY, {
             width: CONTENT_W, align: "right", lineBreak: false, height: 12,
           });

        if (structure.footer && i === totalPages - 1) {
          doc.font(F.bodyRegular).fontSize(9).fillColor(MUTED)
             .text(structure.footer, PAGE_MARGIN, footerY, {
               width: CONTENT_W, align: "left", lineBreak: false, height: 12,
             });
        }
      }

      doc.flushPages();
      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}
