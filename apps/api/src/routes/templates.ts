import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import supabase from '../supabase';

const FieldPlacementSchema = z.object({
  fieldDefinitionId: z.string().uuid(),
  fieldId: z.string().min(1),
  label: z.string().min(1),
  type: z.enum(['text', 'signature', 'date', 'metadata', 'custom']),
  page: z.number().int().min(1),
  x: z.number().min(0).max(1),
  y: z.number().min(0).max(1),
  width: z.number().min(0).max(1),
  height: z.number().min(0).max(1),
});

const CreateTemplateSchema = z.object({
  documentId: z.string().uuid(),
  fields: z.array(FieldPlacementSchema),
});

export async function templateRoutes(app: FastifyInstance) {
  // POST /templates
  app.post('/templates', async (request, reply) => {
    const parsed = CreateTemplateSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: parsed.error.issues[0]?.message ?? 'Invalid input' });
    }

    const { documentId, fields } = parsed.data;

    // Get existing active template version to increment
    const { data: existingTemplates } = await supabase
      .from('document_templates')
      .select('id, version')
      .eq('document_id', documentId)
      .eq('is_active', true);

    const nextVersion = existingTemplates && existingTemplates.length > 0
      ? Math.max(...existingTemplates.map((t: { version: number }) => t.version)) + 1
      : 1;

    // Deactivate existing active templates
    if (existingTemplates && existingTemplates.length > 0) {
      await supabase
        .from('document_templates')
        .update({ is_active: false })
        .eq('document_id', documentId)
        .eq('is_active', true);
    }

    // Insert new template
    const { data: template, error: templateError } = await supabase
      .from('document_templates')
      .insert({
        document_id: documentId,
        version: nextVersion,
        is_active: true,
      })
      .select()
      .single();

    if (templateError || !template) {
      return reply.status(500).send({ error: `Failed to create template: ${templateError?.message}` });
    }

    // Insert template fields
    if (fields.length > 0) {
      const fieldRows = fields.map((f) => ({
        template_id: template.id,
        field_definition_id: f.fieldDefinitionId,
        page: f.page,
        x: f.x,
        y: f.y,
        width: f.width,
        height: f.height,
      }));

      const { error: fieldsError } = await supabase
        .from('template_fields')
        .insert(fieldRows);

      if (fieldsError) {
        return reply.status(500).send({ error: `Failed to insert template fields: ${fieldsError.message}` });
      }
    }

    // Return full template with fields
    return reply.status(201).send(await getFullTemplate(template.id, fields));
  });

  // GET /templates/:documentId
  app.get<{ Params: { documentId: string } }>('/templates/:documentId', async (request, reply) => {
    const { documentId } = request.params;

    const { data: template, error } = await supabase
      .from('document_templates')
      .select('*')
      .eq('document_id', documentId)
      .eq('is_active', true)
      .single();

    if (error || !template) {
      return reply.status(404).send({ error: 'No active template found for this document' });
    }

    const { data: rawFields } = await supabase
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
      .eq('template_id', template.id);

    const fields = (rawFields ?? []).map(toFieldPlacement);

    return reply.send({
      id: template.id,
      documentId: template.document_id,
      version: template.version,
      isActive: template.is_active,
      fields,
    });
  });
}

async function getFullTemplate(templateId: string, originalFields: z.infer<typeof FieldPlacementSchema>[]) {
  const { data: template } = await supabase
    .from('document_templates')
    .select('*')
    .eq('id', templateId)
    .single();

  const { data: rawFields } = await supabase
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

  const fields = (rawFields ?? []).map(toFieldPlacement);

  return {
    id: template?.id,
    documentId: template?.document_id,
    version: template?.version,
    isActive: template?.is_active,
    fields,
  };
}

function toFieldPlacement(row: Record<string, unknown>) {
  const fd = row.field_definitions as Record<string, unknown> | null;
  return {
    id: row.id,
    fieldDefinitionId: fd?.id ?? '',
    fieldId: fd?.field_id ?? '',
    label: fd?.label ?? '',
    type: fd?.type ?? 'text',
    page: row.page,
    x: row.x,
    y: row.y,
    width: row.width,
    height: row.height,
  };
}
