import { FastifyInstance } from 'fastify';
import { randomUUID } from 'crypto';
import { PDFDocument } from 'pdf-lib';
import { z } from 'zod';
import supabase from '../supabase';

export async function documentRoutes(app: FastifyInstance) {
  // POST /documents/upload
  app.post('/documents/upload', async (request, reply) => {
    let fileBuffer: Buffer | null = null;
    let fileName = '';
    let originalFilename = '';

    try {
      const parts = request.parts();
      for await (const part of parts) {
        if (part.type === 'file' && part.fieldname === 'file') {
          originalFilename = part.filename;
          const chunks: Buffer[] = [];
          for await (const chunk of part.file) {
            chunks.push(chunk);
          }
          fileBuffer = Buffer.concat(chunks);
        } else if (part.type === 'field' && part.fieldname === 'name') {
          fileName = part.value as string;
        }
      }
    } catch (err) {
      return reply.status(400).send({ error: 'Failed to parse multipart form data' });
    }

    if (!fileBuffer || fileBuffer.length === 0) {
      return reply.status(400).send({ error: 'Missing file field' });
    }
    if (!fileName) {
      return reply.status(400).send({ error: 'Missing name field' });
    }

    let totalPages = 1;
    try {
      const pdfDoc = await PDFDocument.load(fileBuffer);
      totalPages = pdfDoc.getPageCount();
    } catch {
      return reply.status(400).send({ error: 'Invalid PDF file' });
    }

    const uuid = randomUUID();
    const storagePath = `documents/${uuid}.pdf`;

    const { error: uploadError } = await supabase.storage
      .from('pdf-documents')
      .upload(storagePath, fileBuffer, { contentType: 'application/pdf' });

    if (uploadError) {
      return reply.status(500).send({ error: `Storage upload failed: ${uploadError.message}` });
    }

    const { data, error: insertError } = await supabase
      .from('documents')
      .insert({
        name: fileName,
        original_filename: originalFilename,
        storage_path: storagePath,
        total_pages: totalPages,
      })
      .select()
      .single();

    if (insertError) {
      return reply.status(500).send({ error: `Database insert failed: ${insertError.message}` });
    }

    return reply.status(201).send(toDocumentRecord(data));
  });

  // GET /documents
  app.get('/documents', async (_request, reply) => {
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      return reply.status(500).send({ error: error.message });
    }

    return reply.send((data ?? []).map(toDocumentRecord));
  });

  // GET /documents/:id/file
  app.get<{ Params: { id: string } }>('/documents/:id/file', async (request, reply) => {
    const { id } = request.params;

    const { data: doc, error: fetchError } = await supabase
      .from('documents')
      .select('storage_path')
      .eq('id', id)
      .single();

    if (fetchError || !doc) {
      return reply.status(404).send({ error: 'Document not found' });
    }

    const { data: blob, error: downloadError } = await supabase.storage
      .from('pdf-documents')
      .download(doc.storage_path);

    if (downloadError || !blob) {
      return reply.status(500).send({ error: `Storage download failed: ${downloadError?.message}` });
    }

    const buffer = Buffer.from(await blob.arrayBuffer());

    reply.header('Content-Type', 'application/pdf');
    reply.header('Content-Disposition', 'inline; filename="document.pdf"');
    reply.header('Cache-Control', 'private, max-age=3600');
    return reply.send(buffer);
  });

  // DELETE /documents/:id
  app.delete<{ Params: { id: string } }>('/documents/:id', async (request, reply) => {
    const { id } = request.params;

    const { data: doc, error: fetchError } = await supabase
      .from('documents')
      .select('storage_path')
      .eq('id', id)
      .single();

    if (fetchError || !doc) {
      return reply.status(404).send({ error: 'Document not found' });
    }

    await supabase.storage.from('pdf-documents').remove([doc.storage_path]);

    const { error: deleteError } = await supabase
      .from('documents')
      .delete()
      .eq('id', id);

    if (deleteError) {
      return reply.status(500).send({ error: deleteError.message });
    }

    return reply.status(204).send();
  });
}

function toDocumentRecord(row: Record<string, unknown>) {
  return {
    id: row.id,
    name: row.name,
    originalFilename: row.original_filename,
    storagePath: row.storage_path,
    totalPages: row.total_pages,
    createdAt: row.created_at,
  };
}
