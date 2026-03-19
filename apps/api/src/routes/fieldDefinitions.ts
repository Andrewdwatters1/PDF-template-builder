import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import supabase from '../supabase';

const ExternalFieldSchema = z.array(z.object({
  field_id: z.string().min(1),
  label: z.string().min(1),
  type: z.enum(['text', 'signature', 'date', 'metadata', 'custom']),
}));

function validateApiKey(request: FastifyRequest, reply: FastifyReply, done: () => void) {
  const apiKey = process.env.FIELD_DEFINITIONS_API_KEY;
  if (!apiKey || request.headers['x-api-key'] !== apiKey) {
    reply.status(401).send({ error: 'Unauthorized' });
    return;
  }
  done();
}

export async function fieldDefinitionRoutes(app: FastifyInstance) {
  // GET /field-definitions
  app.get('/field-definitions', { preHandler: validateApiKey }, async (_request, reply) => {
    const { data, error } = await supabase
      .from('field_definitions')
      .select('*')
      .order('category')
      .order('label');

    if (error) {
      return reply.status(500).send({ error: error.message });
    }

    return reply.send((data ?? []).map(toFieldDefinition));
  });

  // POST /field-definitions — accepts an array, upserts on field_id
  app.post('/field-definitions', { preHandler: validateApiKey }, async (request, reply) => {
    const parsed = ExternalFieldSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: parsed.error.issues[0]?.message ?? 'Invalid input' });
    }

    const rows = parsed.data.map(({ field_id, label, type }) => ({
      field_id,
      label,
      type,
      category: 'custom',
      default_width: 0.25,
      default_height: 0.03,
    }));

    const { data, error } = await supabase
      .from('field_definitions')
      .upsert(rows, { onConflict: 'field_id' })
      .select();

    if (error) {
      return reply.status(500).send({ error: error.message });
    }

    return reply.send({ count: (data ?? []).length });
  });

  // DELETE /field-definitions/:id
  app.delete<{ Params: { id: string } }>('/field-definitions/:id', { preHandler: validateApiKey }, async (request, reply) => {
    const { id } = request.params;

    const { data: field, error: fetchError } = await supabase
      .from('field_definitions')
      .select('category')
      .eq('id', id)
      .single();

    if (fetchError || !field) {
      return reply.status(404).send({ error: 'Field definition not found' });
    }

    if (field.category === 'core') {
      return reply.status(403).send({ error: 'Cannot delete core field definitions' });
    }

    const { error: deleteError } = await supabase
      .from('field_definitions')
      .delete()
      .eq('id', id);

    if (deleteError) {
      return reply.status(500).send({ error: deleteError.message });
    }

    return reply.status(204).send();
  });
}

function toFieldDefinition(row: Record<string, unknown>) {
  return {
    id: row.id,
    fieldId: row.field_id,
    label: row.label,
    type: row.type,
    category: row.category,
    defaultWidth: row.default_width,
    defaultHeight: row.default_height,
  };
}
