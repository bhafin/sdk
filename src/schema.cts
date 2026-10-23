/** The JSON Schema subset emitted by our contract generators. */
export interface Schema {
  $ref?: string;
  anyOf?: readonly Schema[];
  const?: unknown;
  enum?: readonly unknown[];
  type?: string;
  minimum?: number;
  maximum?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  format?: string;
  minItems?: number;
  maxItems?: number;
  uniqueItems?: boolean;
  items?: Schema;
  minProperties?: number;
  required?: readonly string[];
  properties?: Readonly<Record<string, Schema>>;
  additionalProperties?: boolean | Schema;
}
export interface Operation {
  path: string;
  method: string;
  status: number;
  readOnly?: boolean;
  marketData?: boolean;
  parameters: readonly {
    name: string;
    in: string;
    required?: boolean;
    schema: Schema;
  }[];
  request?: Schema;
  response: Schema;
}
export function record(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}
