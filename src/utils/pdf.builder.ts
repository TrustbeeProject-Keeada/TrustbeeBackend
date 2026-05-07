import PDFDocument from "pdfkit";

export interface PdfSection {
  heading: string;
  /**
   * Each paragraph supports the format:
   *   "Left line 1\nLeft line 2 | Right side text"
   * - Lines separated by "\n" stack on the left.
   * - Anything after " | " is right-aligned on the FIRST line.
   * - The first left line is rendered in the accent color (entry title),
   *   subsequent left lines are rendered in the body color (subtitle/meta).
   */
  paragraphs?: string[];
  bullets?: string[];
  /**
   * For "skills"-style sections: a flat list of single lines, each separated
   * by a full-width divider (matches the "Tekniska färdigheter" layout).
   */
  dividerLines?: string[];
}

export interface CvStructure {
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
      // ---------- Design tokens ----------
      const PAGE_MARGIN = 50;
      const ACCENT = "#b36a3c"; // terracotta
      const TEXT = "#1a1a1a"; // near-black body
      const MUTED = "#5a5a5a"; // secondary meta text
      const DIVIDER = "#d7d2cc"; // soft warm divider

      // pdfkit ships Times-* and Helvetica-* as standard fonts.
      // The screenshot uses a serif for the name + section headings and
      // sans-serif for body, so we mirror that.
      const selectFonts = (preferred?: string) => {
        const n = (preferred || "").trim().toLowerCase();
        if (["calibri", "arial", "helvetica", "sans"].includes(n)) {
          return {
            displaySerif: "Helvetica-Bold",
            displaySerifLight: "Helvetica",
            bodyRegular: "Helvetica",
            bodyBold: "Helvetica-Bold",
          };
        }
        // Default & georgia/garamond/serif preferences
        return {
          displaySerif: "Times-Bold", // Name + section headings
          displaySerifLight: "Times-Roman", // Subtitle under name
          bodyRegular: "Helvetica", // Body copy
          bodyBold: "Helvetica-Bold", // Emphasis
        };
      };

      const F = selectFonts(structure.preferredFont);

      const doc = new PDFDocument({
        margin: PAGE_MARGIN,
        bufferPages: true,
        size: "A4",
      });

      const PAGE_W = doc.page.width;
      const CONTENT_W = PAGE_W - PAGE_MARGIN * 2;
      const RIGHT_X = PAGE_W - PAGE_MARGIN;

      const chunks: Buffer[] = [];
      doc.on("data", (c: Buffer) => chunks.push(c));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);

      // ---------- Helpers ----------
      const hr = (color = DIVIDER) => {
        const y = doc.y;
        doc
          .strokeColor(color)
          .lineWidth(0.75)
          .moveTo(PAGE_MARGIN, y)
          .lineTo(RIGHT_X, y)
          .stroke();
        doc.strokeColor(TEXT).lineWidth(1);
        doc.y = y + 1;
      };

      const ensureSpace = (needed: number) => {
        if (doc.y + needed > doc.page.height - PAGE_MARGIN - 20) {
          doc.addPage();
        }
      };

      /**
       * Render one row with a left block (one or more lines) and an optional
       * right-aligned single-line label, top-aligned with the first left line.
       */
      const renderEntryRow = (
        leftLines: {
          text: string;
          color: string;
          bold?: boolean;
          size?: number;
        }[],
        rightText?: string,
        rightColor: string = MUTED,
      ) => {
        ensureSpace(40);
        const startY = doc.y;
        const rightSize = 10.5;

        // Right-aligned text, single line, anchored at startY.
        if (rightText) {
          doc.font(F.bodyRegular).fontSize(rightSize).fillColor(rightColor);
          const w = doc.widthOfString(rightText);
          doc.text(rightText, RIGHT_X - w, startY, { lineBreak: false });
        }

        // Left lines, stacked.
        let y = startY;
        for (const line of leftLines) {
          doc
            .font(line.bold ? F.bodyBold : F.bodyRegular)
            .fontSize(line.size ?? 11)
            .fillColor(line.color);
          // Reserve gap on first line so it doesn't run into right meta.
          const widthForLine =
            y === startY && rightText
              ? CONTENT_W - doc.widthOfString(rightText) - 12
              : CONTENT_W;
          doc.text(line.text, PAGE_MARGIN, y, {
            width: widthForLine,
            lineBreak: false,
          });
          y += (line.size ?? 11) * 1.25;
        }

        doc.y = y;
      };

      const isBulletLine = (line: string) => /^[-*•–]\s+/.test(line);
      const stripBullet = (line: string) => line.replace(/^[-*•–]\s+/, "");

      const renderBullets = (bullets: string[]) => {
        if (!bullets || bullets.length === 0) return;
        doc.moveDown(0.1);
        for (const bullet of bullets) {
          ensureSpace(20);
          const y = doc.y;
          doc
            .font(F.bodyRegular)
            .fontSize(11)
            .fillColor(TEXT)
            .text("•", PAGE_MARGIN + 6, y, { lineBreak: false });
          doc.text(bullet, PAGE_MARGIN + 20, y, {
            width: CONTENT_W - 20,
            align: "left",
            lineGap: 2,
          });
          doc.moveDown(0.25);
        }
      };

      // ---------- HEADER ----------
      const headerStartY = doc.y;

      // Name — large serif in accent color
      if (structure.fullName) {
        doc
          .font(F.displaySerif)
          .fontSize(30)
          .fillColor(ACCENT)
          .text(structure.fullName, PAGE_MARGIN, headerStartY, {
            lineBreak: false,
            width: CONTENT_W * 0.6,
          });
      }

      // Headline — lighter serif, accent
      if (structure.headline) {
        doc
          .font(F.displaySerifLight)
          .fontSize(13)
          .fillColor(ACCENT)
          .text(structure.headline, PAGE_MARGIN, headerStartY + 36, {
            lineBreak: false,
            width: CONTENT_W * 0.6,
          });
      }

      // Contact info — right-aligned, two lines, accent
      const contactLine1Parts = [structure.contactInfo.email];
      if (structure.contactInfo.phone)
        contactLine1Parts.push(structure.contactInfo.phone);
      const contactLine1 = contactLine1Parts.join("  •  ");
      const contactLine2 = structure.contactInfo.location || "";

      doc
        .font(F.bodyRegular)
        .fontSize(10.5)
        .fillColor(ACCENT)
        .text(contactLine1, PAGE_MARGIN, headerStartY + 6, {
          width: CONTENT_W,
          align: "right",
          lineBreak: false,
        });

      if (contactLine2) {
        doc
          .font(F.bodyRegular)
          .fontSize(10.5)
          .fillColor(ACCENT)
          .text(contactLine2, PAGE_MARGIN, headerStartY + 22, {
            width: CONTENT_W,
            align: "right",
            lineBreak: false,
          });
      }

      const headerEndY = headerStartY + (structure.headline ? 60 : 44);
      doc.y = headerEndY;
      doc.moveDown(0.6);

      // ---------- PROFESSIONAL SUMMARY ----------
      if (structure.professionalSummary) {
        doc
          .font(F.bodyRegular)
          .fontSize(11)
          .fillColor(TEXT)
          .text(structure.professionalSummary, PAGE_MARGIN, doc.y, {
            width: CONTENT_W,
            align: "left",
            lineGap: 3,
          });
        doc.moveDown(1.2);
      }

      // ---------- SECTIONS ----------
      for (const section of structure.sections) {
        ensureSpace(80);

        // Section heading — large serif, accent, sentence-case
        doc
          .font(F.displaySerif)
          .fontSize(20)
          .fillColor(ACCENT)
          .text(section.heading, PAGE_MARGIN, doc.y, {
            width: CONTENT_W,
            lineBreak: false,
          });
        doc.moveDown(0.6);

        // --- Entries ---
        if (section.paragraphs && section.paragraphs.length > 0) {
          for (let i = 0; i < section.paragraphs.length; i++) {
            const para = section.paragraphs[i];
            const parts = para.split("|").map((s) => s.trim());
            const leftRaw = parts[0];
            const rightText = parts.slice(1).join(" | ");

            const leftLines = leftRaw
              .split("\n")
              .map((s) => s.trim())
              .filter(Boolean);

            const firstBulletIndex = leftLines.findIndex(isBulletLine);
            const entryLinesRaw =
              firstBulletIndex >= 0
                ? leftLines.slice(0, firstBulletIndex)
                : leftLines;
            const bulletLinesRaw =
              firstBulletIndex >= 0 ? leftLines.slice(firstBulletIndex) : [];
            const bulletLines = bulletLinesRaw.map(stripBullet).filter(Boolean);

            const lines = entryLinesRaw.map((text, idx) => ({
              text,
              color: idx === 0 ? ACCENT : TEXT,
              bold: false,
              size: 11,
            }));

            if (lines.length > 0) {
              renderEntryRow(lines, rightText || undefined, MUTED);
            }

            if (bulletLines.length > 0) {
              renderBullets(bulletLines);
            }
            doc.moveDown(0.35);
          }
        }

        // --- Bullets ---
        if (section.bullets && section.bullets.length > 0) {
          renderBullets(section.bullets);
        }

        // --- Divider-separated rows (skills) ---
        if (section.dividerLines && section.dividerLines.length > 0) {
          hr();
          doc.moveDown(0.5);
          for (const line of section.dividerLines) {
            ensureSpace(28);
            doc
              .font(F.bodyRegular)
              .fontSize(11)
              .fillColor(TEXT)
              .text(line, PAGE_MARGIN, doc.y, {
                width: CONTENT_W,
                lineBreak: false,
              });
            doc.moveDown(0.6);
            hr();
            doc.moveDown(0.5);
          }
        }

        doc.moveDown(0.8);
      }

      // ---------- FOOTER (page numbers on every page) ----------
      // We write the footer INSIDE the bottom margin (above the page edge but
      // below content). Critically we suppress pdfkit's automatic page wrap
      // by temporarily disabling it via the `height` option.
      const range = doc.bufferedPageRange();
      const totalPages = range.count;
      for (let i = 0; i < totalPages; i++) {
        doc.switchToPage(range.start + i);
        const footerY = doc.page.height - PAGE_MARGIN / 2 - 6;
        const label = `Page ${i + 1} | ${totalPages}`;

        doc
          .font(F.bodyRegular)
          .fontSize(9)
          .fillColor(MUTED)
          .text(label, PAGE_MARGIN, footerY, {
            width: CONTENT_W,
            align: "right",
            lineBreak: false,
            height: 12,
          });

        if (structure.footer && i === totalPages - 1) {
          doc
            .font(F.bodyRegular)
            .fontSize(9)
            .fillColor(MUTED)
            .text(structure.footer, PAGE_MARGIN, footerY, {
              width: CONTENT_W,
              align: "left",
              lineBreak: false,
              height: 12,
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
