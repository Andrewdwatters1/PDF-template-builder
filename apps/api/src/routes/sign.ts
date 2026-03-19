import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import supabase from '../supabase';

const SigningPayloadSchema = z.object({
  templateId: z.string().uuid(),
  fieldValues: z.record(z.string(), z.string()),
});

export async function signRoutes(app: FastifyInstance) {
  // POST /sign
  app.post('/sign', async (request, reply) => {
    const parsed = SigningPayloadSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: parsed.error.issues[0]?.message ?? 'Invalid input' });
    }

    const { templateId, fieldValues } = parsed.data;

    // Load template
    const { data: template, error: templateError } = await supabase
      .from('document_templates')
      .select('*, documents(*)')
      .eq('id', templateId)
      .single();

    if (templateError || !template) {
      return reply.status(404).send({ error: 'Template not found' });
    }

    // Load template fields with field definitions
    const { data: rawFields, error: fieldsError } = await supabase
      .from('template_fields')
      .select(`
        id,
        page,
        x,
        y,
        width,
        height,
        field_definitions (
          id,
          field_id,
          label,
          type
        )
      `)
      .eq('template_id', templateId);

    if (fieldsError) {
      return reply.status(500).send({ error: `Failed to load template fields: ${fieldsError.message}` });
    }

    const document = template.documents as Record<string, unknown>;

    // Download original PDF
    const { data: blob, error: downloadError } = await supabase.storage
      .from('pdf-documents')
      .download(document.storage_path as string);

    if (downloadError || !blob) {
      return reply.status(500).send({ error: `Failed to download PDF: ${downloadError?.message}` });
    }

    const pdfBytes = Buffer.from(await blob.arrayBuffer());

    // Load and stamp PDF
    const pdfDoc = await PDFDocument.load(pdfBytes);
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const pages = pdfDoc.getPages();

    for (const rawField of rawFields ?? []) {
      const fd = rawField.field_definitions as Record<string, unknown>;
      const fieldId = fd?.field_id as string;
      const fieldType = fd?.type as string;
      const value = fieldValues[fieldId];

      if (!value) continue;

      const pageIndex = (rawField.page as number) - 1;
      if (pageIndex < 0 || pageIndex >= pages.length) continue;

      const page = pages[pageIndex];
      const { width: pageW, height: pageH } = page.getSize();

      const absX = (rawField.x as number) * pageW;
      const absY = pageH - ((rawField.y as number) * pageH) - ((rawField.height as number) * pageH);
      const absW = (rawField.width as number) * pageW;
      const absH = (rawField.height as number) * pageH;
      const fontSize = Math.max(6, absH * 0.6);

      if (fieldType === 'signature') {
        if (value.startsWith('data:image/')) {
          try {
            const base64Data = value.split(',')[1];
            const imageBytes = Buffer.from(base64Data, 'base64');
            let image;
            if (value.includes('image/png')) {
              image = await pdfDoc.embedPng(imageBytes);
            } else {
              image = await pdfDoc.embedJpg(imageBytes);
            }
            page.drawImage(image, { x: absX, y: absY, width: absW, height: absH });
          } catch {
            // Fall back to text if image embedding fails
            page.drawText(value.substring(0, 20), {
              x: absX,
              y: absY + absH * 0.2,
              size: fontSize,
              font,
              color: rgb(0, 0, 0),
            });
          }
        } else {
          page.drawText(value, {
            x: absX,
            y: absY + absH * 0.2,
            size: fontSize,
            font,
            color: rgb(0, 0, 0),
          });
        }
      } else if (fieldType === 'metadata') {
        // Draw small footer-style text at bottom of page
        const footerY = 20;
        page.drawText(value, {
          x: 20,
          y: footerY,
          size: 7,
          font,
          color: rgb(0.4, 0.4, 0.4),
        });
      } else {
        // text, date, custom
        page.drawText(value, {
          x: absX,
          y: absY + absH * 0.2,
          size: fontSize,
          font,
          color: rgb(0, 0, 0),
          maxWidth: absW,
        });
      }
    }

    const signedBytes = await pdfDoc.save();

    reply.header('Content-Type', 'application/pdf');
    reply.header('Content-Disposition', 'attachment; filename="signed.pdf"');
    return reply.send(Buffer.from(signedBytes));
  });
}
