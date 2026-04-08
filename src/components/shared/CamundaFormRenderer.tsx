import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Upload, X, CheckCircle2 } from 'lucide-react';
import type { CamundaFormSchema, CamundaFormComponent } from '../../types/camunda';

interface CamundaFormRendererProps {
  schema: CamundaFormSchema;
  onSubmit: (data: any) => void;
  isSubmitting?: boolean;
  defaultValues?: any;
  /** Extra variables passed to the form for dynamic option resolution (valuesExpression) */
  data?: Record<string, unknown>;
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1 text-xs text-red-500">{message}</p>;
}

function getErrorMessage(err: unknown): string | undefined {
  if (!err) return undefined;
  if (typeof err === 'string') return err;
  if (typeof err === 'object' && err !== null && 'message' in err && typeof (err as Record<string, unknown>).message === 'string') {
    return (err as { message: string }).message;
  }
  return undefined;
}

function FormFieldWrapper({
  label, required, children, error, helper
}: { label: string; required?: boolean; children: React.ReactNode; error?: any; helper?: string }) {
  const errorMsg = getErrorMessage(error);
  return (
    <div className="space-y-1.5 mb-4">
      <label className="block text-sm font-medium text-foreground">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
      {helper && !errorMsg && <p className="text-xs text-muted-foreground">{helper}</p>}
      <FieldError message={errorMsg} />
    </div>
  );
}

function evaluateCondition(expression: string, values: Record<string, any>): boolean {
  if (!expression) return true;
  // FEEL-like hide expressions: "=action != \"return\"", "=faultDescription = null or faultDescription = \"\""
  const expr = expression.startsWith('=') ? expression.slice(1).trim() : expression.trim();

  // Handle "or" by splitting and returning true (show) only when ALL parts are false (none hides)
  if (expr.includes(' or ')) {
    const parts = expr.split(' or ').map(p => p.trim());
    const anyTrue = parts.some(p => evaluateSingleCondition(p, values));
    return !anyTrue; // hide=true means don't show
  }

  return !evaluateSingleCondition(expr, values);
}

function evaluateSingleCondition(expr: string, values: Record<string, any>): boolean {
  // "field != value" or "field = value"
  let match = expr.match(/^(\w+)\s*!=\s*(.+)$/);
  if (match) {
    const [, field, rawVal] = match;
    const expected = parseFeelValue(rawVal);
    return values[field] !== expected;
  }
  match = expr.match(/^(\w+)\s*=\s*(.+)$/);
  if (match) {
    const [, field, rawVal] = match;
    const expected = parseFeelValue(rawVal);
    return values[field] === expected || (expected === null && (values[field] === undefined || values[field] === '' || values[field] === null));
  }
  return false;
}

function parseFeelValue(raw: string): any {
  const trimmed = raw.trim();
  if (trimmed === 'null') return null;
  if (trimmed === 'true') return true;
  if (trimmed === 'false') return false;
  if (trimmed.startsWith('"') && trimmed.endsWith('"')) return trimmed.slice(1, -1);
  return trimmed;
}

/**
 * Resolve a FEEL-like valuesExpression (e.g. "=vehicleTypes") against the
 * provided data context. Returns an array of {label, value} or empty array.
 */
function resolveValuesExpression(
  expression: string | undefined,
  data: Record<string, unknown>
): Array<{ label: string; value: string }> {
  if (!expression) return [];
  const varName = expression.startsWith('=') ? expression.slice(1).trim() : expression.trim();
  const resolved = data[varName];
  if (!Array.isArray(resolved)) return [];
  return resolved
    .filter((item): item is Record<string, unknown> => item != null && typeof item === 'object')
    .map(item => ({
      label: String(item.label ?? item.value ?? ''),
      value: String(item.value ?? item.label ?? ''),
    }));
}

function interpolateText(template: string | undefined, values: Record<string, unknown>): string {
  if (!template) return '';

  return template.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, key: string) => {
    const value = values[key];
    if (value == null) return '';
    if (Array.isArray(value)) {
      return value.map((item) => String(item)).join('، ');
    }
    return String(value);
  });
}

export function CamundaFormRenderer({ schema, onSubmit, isSubmitting, defaultValues = {}, data: externalData = {} }: CamundaFormRendererProps) {
  const { register, handleSubmit, formState: { errors }, watch, setValue } = useForm({
    defaultValues
  });
  const [uploadedFiles, setUploadedFiles] = useState<Record<string, File>>({});
  const watchedValues = watch();
  const displayValues = { ...externalData, ...defaultValues, ...watchedValues };

  const handleFormSubmit = (data: any) => {
    // Merge file data if needed, or pass it directly. We'll pass filenames or file objects.
    const finalData = { ...data };
    Object.keys(uploadedFiles).forEach(key => {
      finalData[key] = uploadedFiles[key];
    });
    onSubmit(finalData);
  };

  const inputClass = 'w-full rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all disabled:opacity-50 disabled:cursor-not-allowed';

  const renderComponent = (comp: CamundaFormComponent) => {
    // Get Arabic label if available, fallback to English or default label
    const label = comp.properties?.labelAr || comp.properties?.labelEn || comp.label;
    const isRequired = comp.validate?.required === true;
    
    // Convert validation rules to React Hook Form format
    const validationRules: any = { required: isRequired ? 'هذا الحقل مطلوب' : false };
    if (comp.validate?.minLength) validationRules.minLength = { value: Number(comp.validate.minLength), message: `يجب أن يكون ${comp.validate.minLength} حرفاً على الأقل` };
    if (comp.validate?.maxLength) validationRules.maxLength = { value: Number(comp.validate.maxLength), message: `يجب أن لا يتجاوز ${comp.validate.maxLength} حرفاً` };
    if (comp.validate?.min) validationRules.min = { value: Number(comp.validate.min), message: `الحد الأدنى هو ${comp.validate.min}` };
    if (comp.validate?.max) validationRules.max = { value: Number(comp.validate.max), message: `الحد الأقصى هو ${comp.validate.max}` };
    if (comp.validate?.pattern) validationRules.pattern = { value: new RegExp(comp.validate.pattern), message: 'صيغة غير صحيحة' };

    switch (comp.type) {
      case 'text': {
        // Static text/markdown display — headings and dividers
        const resolvedText = interpolateText(comp.text, displayValues);
        return (
          <div key={comp.key} className="mb-4">
            {resolvedText.split('\n').map((line: string, i: number) => {
              if (line.startsWith('## ')) return <h2 key={i} className="text-lg font-semibold text-foreground mt-2">{line.slice(3)}</h2>;
              if (line.startsWith('# ')) return <h1 key={i} className="text-xl font-bold text-foreground mt-2">{line.slice(2)}</h1>;
              if (line.trim() === '---') return <hr key={i} className="border-border my-3" />;
              return line.trim() ? <p key={i} className="text-sm text-muted-foreground">{line}</p> : null;
            })}
          </div>
        );
      }

      case 'textfield':
      case 'email':
      case 'password':
      case 'number':
        return (
          <FormFieldWrapper key={comp.key} label={label} required={isRequired} error={errors[comp.key]} helper={comp.description}>
            <input
              type={comp.type === 'textfield' ? 'text' : comp.type}
              {...register(comp.key, comp.type === 'number' ? { ...validationRules, valueAsNumber: true } : validationRules)}
              disabled={comp.disabled}
              readOnly={comp.readonly}
              className={`${inputClass}${comp.readonly ? ' bg-muted/50 cursor-default' : ''}`}
            />
          </FormFieldWrapper>
        );

      case 'datetime':
      case 'date':
      case 'time':
        return (
          <FormFieldWrapper key={comp.key} label={label} required={isRequired} error={errors[comp.key]} helper={comp.description}>
            <input
              type={comp.type === 'datetime' ? 'datetime-local' : comp.type}
              {...register(comp.key, validationRules)}
              disabled={comp.disabled}
              readOnly={comp.readonly}
              className={`${inputClass}${comp.readonly ? ' bg-muted/50 cursor-default' : ''}`}
            />
          </FormFieldWrapper>
        );
      
      case 'textarea':
        return (
          <FormFieldWrapper key={comp.key} label={label} required={isRequired} error={errors[comp.key]} helper={comp.description}>
            <textarea
              {...register(comp.key, validationRules)}
              disabled={comp.disabled}
              readOnly={comp.readonly}
              className={`${inputClass} min-h-[100px] resize-y`}
            />
          </FormFieldWrapper>
        );

      case 'select': {
        const dynamicExpr = comp.valuesExpression ?? comp.valuesKey;
        const options = comp.values?.length ? comp.values : resolveValuesExpression(dynamicExpr, externalData);
        return (
          <FormFieldWrapper key={comp.key} label={label} required={isRequired} error={errors[comp.key]} helper={comp.description}>
            <select
              {...register(comp.key, validationRules)}
              disabled={comp.disabled}
              className={`${inputClass} cursor-pointer`}
            >
              <option value="">اختر...</option>
              {options.map(v => (
                <option key={v.value} value={v.value}>{v.label}</option>
              ))}
            </select>
          </FormFieldWrapper>
        );
      }

      case 'radio': {
        const dynamicExpr = comp.valuesExpression ?? comp.valuesKey;
        const options = comp.values?.length ? comp.values : resolveValuesExpression(dynamicExpr, externalData);
        return (
          <FormFieldWrapper key={comp.key} label={label} required={isRequired} error={errors[comp.key]} helper={comp.description}>
            <div className="space-y-2 mt-1">
              {options.map(v => (
                <label key={v.value} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    value={v.value}
                    {...register(comp.key, validationRules)}
                    disabled={comp.disabled || comp.readonly}
                    className="h-4 w-4 text-primary border-input focus:ring-ring"
                  />
                  <span className="text-sm text-foreground">{v.label}</span>
                </label>
              ))}
            </div>
          </FormFieldWrapper>
        );
      }

      case 'checkbox':
        return (
          <FormFieldWrapper key={comp.key} label="" required={false} error={errors[comp.key]} helper={comp.description}>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                {...register(comp.key, validationRules)}
                disabled={comp.disabled || comp.readonly}
                className="h-4 w-4 rounded border-input text-primary focus:ring-ring"
              />
              <span className="text-sm text-foreground">{label}</span>
            </label>
          </FormFieldWrapper>
        );

      case 'filepicker':
      case 'file': {
        const file = uploadedFiles[comp.key];
        return (
          <FormFieldWrapper key={comp.key} label={label} required={isRequired && !file} error={errors[comp.key]} helper={comp.description}>
            {!file ? (
              <div className="flex items-center justify-center w-full">
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-input rounded-lg cursor-pointer bg-muted/20 hover:bg-muted/50 transition-colors">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <Upload className="w-8 h-8 mb-2 text-muted-foreground" />
                    <p className="mb-2 text-sm text-foreground"><span className="font-semibold">اضغط للرفع</span> أو اسحب الملف هنا</p>
                  </div>
                  <input
                    type="file"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setUploadedFiles(prev => ({ ...prev, [comp.key]: e.target.files![0] }));
                        // Clear error if required
                        if (isRequired) setValue(comp.key, e.target.files![0].name, { shouldValidate: true });
                      }
                    }}
                    disabled={comp.disabled}
                  />
                  {/* Register for RHF validation even if hidden */}
                  <input type="hidden" {...register(comp.key, validationRules)} />
                </label>
              </div>
            ) : (
              <div className="flex items-center justify-between p-3 border border-border rounded-lg bg-card">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 text-primary rounded-md">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div className="text-sm">
                    <p className="font-medium text-foreground">{file.name}</p>
                    <p className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(1)} KB</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setUploadedFiles(prev => {
                      const newFiles = { ...prev };
                      delete newFiles[comp.key];
                      return newFiles;
                    });
                    setValue(comp.key, '', { shouldValidate: true });
                  }}
                  className="p-1 hover:bg-muted rounded-md transition-colors"
                >
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>
            )}
          </FormFieldWrapper>
        );
      }

      default:
        // Fallback for unsupported types
        return (
          <div key={comp.key} className="p-4 mb-4 text-sm text-amber-800 bg-amber-50 rounded-lg">
            نوع الحقل غير مدعوم ({comp.type}) - {label}
          </div>
        );
    }
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
      <div className="bg-card border border-border rounded-xl p-5 shadow-sm">        
        <div className="grid grid-cols-1 gap-x-6 gap-y-2 lg:grid-cols-2">
          {schema.components.map(comp => {
            // Evaluate conditional hide
            if (comp.conditional?.hide) {
              const visible = evaluateCondition(comp.conditional.hide, watchedValues);
              if (!visible) return null;
            }
            const fullWidth = comp.type === 'textarea' || comp.type === 'file' || comp.type === 'text' || comp.type === 'radio';
            return (
              <div key={comp.key} className={fullWidth ? 'lg:col-span-2' : 'col-span-1'}>
                {renderComponent(comp)}
              </div>
            );
          })}
        </div>

        <div className="mt-6 flex justify-end">
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex items-center gap-2 rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {isSubmitting ? 'جارٍ الحفظ...' : 'إرسال'}
          </button>
        </div>
      </div>
    </form>
  );
}
