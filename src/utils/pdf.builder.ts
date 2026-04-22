import PDFDocument from "pdfkit";

export interface PdfSection {
  heading: string;
  paragraphs?: string[];
  bullets?: string[];
}

export interface CvStructure {
  fullName: string;
  contactInfo: {
    email: string;
    phone: string;
    location?: string;
  };
  professionalSummary?: string;
  sections: PdfSection[];
  footer?: string;
}

export async function buildCvPdf(structure: CvStructure): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        margin: 50,
        bufferPages: true,
      });

      const chunks: Buffer[] = [];

      // Collect PDF data into buffer
      doc.on("data", (chunk: Buffer) => {
        chunks.push(chunk);
      });

      doc.on("end", () => {
        const pdfBuffer = Buffer.concat(chunks);
        resolve(pdfBuffer);
      });

      doc.on("error", reject);

      // Header: Full Name
      doc
        .fontSize(24)
        .font("Helvetica-Bold")
        .text(structure.fullName, { align: "center" });
      doc.moveDown(0.3);

      // Contact Info
      const contactParts = [structure.contactInfo.email];
      if (structure.contactInfo.phone)
        contactParts.push(structure.contactInfo.phone);
      if (structure.contactInfo.location)
        contactParts.push(structure.contactInfo.location);

      doc
        .fontSize(10)
        .font("Helvetica")
        .text(contactParts.join(" | "), { align: "center" });
      doc.moveDown(0.8);

      // Divider line
      doc
        .moveTo(50, doc.y)
        .lineTo(doc.page.width - 50, doc.y)
        .stroke();
      doc.moveDown(0.8);

      // Professional Summary
      if (structure.professionalSummary) {
        doc.fontSize(12).font("Helvetica-Bold").text("PROFESSIONAL SUMMARY");
        doc.moveDown(0.3);
        doc
          .fontSize(11)
          .font("Helvetica")
          .text(structure.professionalSummary, { align: "left", lineGap: 4 });
        doc.moveDown(0.8);
      }

      // Sections
      for (const section of structure.sections) {
        // Section heading
        doc.fontSize(12).font("Helvetica-Bold").text(section.heading);
        doc.moveDown(0.3);

        // Paragraphs
        if (section.paragraphs && section.paragraphs.length > 0) {
          for (const para of section.paragraphs) {
            doc
              .fontSize(11)
              .font("Helvetica")
              .text(para, { align: "left", lineGap: 3 });
            doc.moveDown(0.5);
          }
        }

        // Bullet points
        if (section.bullets && section.bullets.length > 0) {
          for (const bullet of section.bullets) {
            doc.fontSize(11).font("Helvetica").text(`• ${bullet}`, {
              indent: 20,
              lineGap: 3,
            });
            doc.moveDown(0.4);
          }
          doc.moveDown(0.3);
        }

        doc.moveDown(0.5);
      }

      // Footer
      if (structure.footer) {
        doc.moveDown(1);
        doc
          .fontSize(9)
          .fillColor("gray")
          .text(structure.footer, { align: "center" });
      }

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}
