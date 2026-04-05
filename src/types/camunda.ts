export interface CamundaFormSchema {
  executionPlatform: string;
  executionPlatformVersion: string;
  exporter: {
    name: string;
    version: string;
  };
  schemaVersion: number;
  id: string;
  components: CamundaFormComponent[];
}

export interface CamundaFormComponent {
  id: string;
  key: string;
  type: 'textfield' | 'textarea' | 'number' | 'password' | 'email' | 'checkbox' | 'radio' | 'select' | 'button' | 'text' | 'datetime' | 'file' | string;
  label: string;
  text?: string;
  accept?: string;
  description?: string;
  disabled?: boolean;
  readonly?: boolean;
  defaultValue?: any;
  conditional?: {
    hide?: string;
  };
  layout?: {
    row: string;
    columns: number | null;
  };
  validate?: {
    required?: boolean;
    minLength?: number | string;
    maxLength?: number | string;
    min?: number | string;
    max?: number | string;
    pattern?: string;
  };
  properties?: {
    labelAr?: string;
    labelEn?: string;
    [key: string]: any;
  };
  values?: Array<{
    label: string;
    value: string;
  }>; // For Select/Radio (static)
  valuesExpression?: string; // For Select/Radio (FEEL expression e.g. "=myOptions")
  valuesKey?: string; // For Select/Radio (input data / valuesKey e.g. "=myOptions")
}
