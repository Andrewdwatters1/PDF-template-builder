"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.fieldDefinitionRoutes = fieldDefinitionRoutes;
const zod_1 = require("zod");
const supabase_1 = __importDefault(require("../supabase"));
const CreateFieldSchema = zod_1.z.object({
    fieldId: zod_1.z.string().min(1).regex(/^[a-z0-9_]+$/, 'fieldId must be lowercase letters, numbers, and underscores only'),
    label: zod_1.z.string().min(1),
    type: zod_1.z.enum(['text', 'signature', 'date', 'metadata', 'custom']),
    defaultWidth: zod_1.z.number().min(0.01).max(1).optional(),
    defaultHeight: zod_1.z.number().min(0.01).max(1).optional(),
});
async function fieldDefinitionRoutes(app) {
    // GET /field-definitions
    app.get('/field-definitions', async (_request, reply) => {
        const { data, error } = await supabase_1.default
            .from('field_definitions')
            .select('*')
            .order('category')
            .order('label');
        if (error) {
            return reply.status(500).send({ error: error.message });
        }
        return reply.send((data ?? []).map(toFieldDefinition));
    });
    // POST /field-definitions
    app.post('/field-definitions', async (request, reply) => {
        const parsed = CreateFieldSchema.safeParse(request.body);
        if (!parsed.success) {
            return reply.status(400).send({ error: parsed.error.issues[0]?.message ?? 'Invalid input' });
        }
        const { fieldId, label, type, defaultWidth = 0.25, defaultHeight = 0.03 } = parsed.data;
        const { data, error } = await supabase_1.default
            .from('field_definitions')
            .insert({
            field_id: fieldId,
            label,
            type,
            category: 'custom',
            default_width: defaultWidth,
            default_height: defaultHeight,
        })
            .select()
            .single();
        if (error) {
            if (error.code === '23505') {
                return reply.status(409).send({ error: `Field ID "${fieldId}" already exists` });
            }
            return reply.status(500).send({ error: error.message });
        }
        return reply.status(201).send(toFieldDefinition(data));
    });
    // DELETE /field-definitions/:id
    app.delete('/field-definitions/:id', async (request, reply) => {
        const { id } = request.params;
        const { data: field, error: fetchError } = await supabase_1.default
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
        const { error: deleteError } = await supabase_1.default
            .from('field_definitions')
            .delete()
            .eq('id', id);
        if (deleteError) {
            return reply.status(500).send({ error: deleteError.message });
        }
        return reply.status(204).send();
    });
}
function toFieldDefinition(row) {
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
