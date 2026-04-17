import { useEffect, useRef } from 'react';
import { Form } from '@bpmn-io/form-js';
import '@bpmn-io/form-js/dist/assets/form-js.css';
import type { CamundaFormSchema } from '@/types/camunda';

interface OfficialCamundaFormViewerProps {
  schema: CamundaFormSchema;
  onSubmit: (data: any) => void;
  data?: any;
}

export function OfficialCamundaFormViewer({ schema, onSubmit, data = {} }: OfficialCamundaFormViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const formInstanceRef = useRef<any>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Initialize the official Camunda form instance
    const form = new Form({
      container: containerRef.current,
    });

    formInstanceRef.current = form;
console.log(schema);

    // Load schema and default data
    form.importSchema(schema, data).catch((err: any) => {
      console.error('Failed to import Camunda Form Schema', err);
    });

    // Listen to form submit events
    form.on('submit', (event: any) => {
      // With newer @bpmn-io/form-js versions, validation errors are pushed to event.errors
      if (event.errors && Object.keys(event.errors).length > 0) {
        return; // Validation failed, do nothing (form-js shows the errors internally)
      }
      onSubmit(event.data);
    });

    // Cleanup on unmount
    return () => {
      form.destroy();
    };
  }, [schema, data, onSubmit]);

  return (
    <div className="bg-card border border-border rounded-xl p-5 shadow-sm overflow-hidden camunda-official-wrapper">
      <h3 className="font-semibold text-lg mb-4 text-foreground border-b border-border pb-3">
        إكمال المهمة (النموذج الرسمي)
      </h3>
      {/* Container for the Vanilla JS Form Viewer */}
      <div 
        ref={containerRef} 
        className="w-full h-full"
        dir="ltr" // Camunda official form is often strongly built for LTR, you may need CSS to force RTL
      />
    </div>
  );
}
