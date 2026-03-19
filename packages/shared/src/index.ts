export type FieldType = 'text' | 'signature' | 'date' | 'metadata' | 'custom';
export type FieldCategory = 'core' | 'custom';

export interface FieldDefinition {
  id: string;
  fieldId: string;
  label: string;
  type: FieldType;
  category: FieldCategory;
  defaultWidth: number;
  defaultHeight: number;
}

export interface TemplateFieldPlacement {
  id?: string;
  fieldDefinitionId: string;
  fieldId: string;
  label: string;
  type: FieldType;
  page: number;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface DocumentTemplate {
  id: string;
  documentId: string;
  version: number;
  isActive: boolean;
  fields: TemplateFieldPlacement[];
}

export interface DocumentRecord {
  id: string;
  name: string;
  originalFilename: string;
  storagePath: string;
  totalPages: number;
  createdAt: string;
}

export interface SigningPayload {
  templateId: string;
  fieldValues: Record<string, string>;
}
