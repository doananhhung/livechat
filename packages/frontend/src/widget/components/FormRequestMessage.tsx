import { h, type JSX } from 'preact';
import { useState, useMemo, useCallback } from 'preact/hooks';
import type { 
  FormRequestMetadata, 
  ActionFieldDefinition, 
  ActionFieldType 
} from '@live-chat/shared-types';

interface FormRequestMessageProps {
  metadata: FormRequestMetadata;
  messageId: string;
  onSubmit: (messageId: string, data: Record<string, unknown>) => Promise<void>;
  primaryColor?: string;
  theme: 'light' | 'dark';
  isExpired?: boolean;
  isSubmitted?: boolean;
}

/**
 * Renders a form sent by an agent that the visitor can fill out.
 */
export const FormRequestMessage = ({
  metadata,
  messageId,
  onSubmit,
  primaryColor,
  theme,
  isExpired = false,
  isSubmitted = false,
}: FormRequestMessageProps) => {
  const [formData, setFormData] = useState<Record<string, unknown>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const fields = metadata.definition.fields;

  const handleChange = useCallback((key: string, value: unknown) => {
    setFormData(prev => ({ ...prev, [key]: value }));
    // Clear error when user types
    if (errors[key]) {
      setErrors(prev => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  }, [errors]);

  const validate = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};
    
    for (const field of fields) {
      const value = formData[field.key];
      
      if (field.required && (value === undefined || value === '' || value === null)) {
        newErrors[field.key] = `${field.label} is required`;
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [fields, formData]);

  const handleSubmit = async (e: { preventDefault: () => void }) => {
    e.preventDefault();
    
    if (!validate()) return;
    
    setIsSubmitting(true);
    try {
      await onSubmit(messageId, formData);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isDisabled = isExpired || isSubmitted || isSubmitting;

  const containerStyle = useMemo(() => ({
    backgroundColor: theme === 'light' ? '#ffffff' : '#1f2937',
    border: theme === 'light' ? '2px solid #e5e7eb' : '2px solid #374151',
    borderRadius: '16px',
    padding: '24px',
    maxWidth: '400px',
    width: '100%',
    margin: '8px auto',
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
  }), [theme]);

  const labelStyle = useMemo(() => ({
    color: theme === 'light' ? '#374151' : '#d1d5db',
    fontSize: '14px',
    fontWeight: 500,
    marginBottom: '4px',
    display: 'block',
  }), [theme]);

  const inputStyle = useMemo(() => ({
    width: '100%',
    padding: '8px 12px',
    borderRadius: '6px',
    border: theme === 'light' ? '1px solid #d1d5db' : '1px solid #4b5563',
    backgroundColor: theme === 'light' ? '#ffffff' : '#374151',
    color: theme === 'light' ? '#1f2937' : '#f3f4f6',
    fontSize: '14px',
    outline: 'none',
  }), [theme]);

  const buttonStyle = useMemo(() => ({
    width: '100%',
    padding: '10px 16px',
    borderRadius: '8px',
    border: 'none',
    backgroundColor: isDisabled ? '#9ca3af' : (primaryColor || '#2563eb'),
    color: '#ffffff',
    fontSize: '14px',
    fontWeight: 600,
    cursor: isDisabled ? 'not-allowed' : 'pointer',
    marginTop: '12px',
  }), [isDisabled, primaryColor]);

  const renderField = (field: ActionFieldDefinition) => {
    const value = formData[field.key] ?? '';
    const error = errors[field.key];

    const commonProps = {
      id: `form-${messageId}-${field.key}`,
      name: field.key,
      disabled: isDisabled,
      style: { ...inputStyle, borderColor: error ? '#ef4444' : inputStyle.border },
    };

    let input;
    switch (field.type) {
      case 'number':
        input = (
          <input
            {...commonProps}
            type="number"
            value={value as number}
            onInput={(e) => handleChange(field.key, (e.target as HTMLInputElement).valueAsNumber)}
          />
        );
        break;
      case 'date':
        input = (
          <input
            {...commonProps}
            type="date"
            value={value as string}
            onInput={(e) => handleChange(field.key, (e.target as HTMLInputElement).value)}
          />
        );
        break;
      case 'boolean':
        input = (
          <input
            {...commonProps}
            type="checkbox"
            checked={value as boolean}
            onChange={(e) => handleChange(field.key, (e.target as HTMLInputElement).checked)}
            style={{ width: 'auto', marginRight: '8px' }}
          />
        );
        break;
      case 'select':
        input = (
          <select
            {...commonProps}
            value={value as string}
            onChange={(e) => handleChange(field.key, (e.target as HTMLSelectElement).value)}
          >
            <option value="">Select...</option>
            {field.options?.map(opt => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        );
        break;
      default:
        input = (
          <input
            {...commonProps}
            type="text"
            value={value as string}
            onInput={(e) => handleChange(field.key, (e.target as HTMLInputElement).value)}
          />
        );
    }

    return (
      <div key={field.key} style={{ marginBottom: '12px' }}>
        <label htmlFor={commonProps.id} style={labelStyle}>
          {field.label}
          {field.required && <span style={{ color: '#ef4444' }}> *</span>}
        </label>
        {input}
        {error && (
          <span style={{ color: '#ef4444', fontSize: '12px', marginTop: '2px', display: 'block' }}>
            {error}
          </span>
        )}
      </div>
    );
  };

  if (isSubmitted) {
    return (
      <div style={containerStyle}>
        <div style={{ textAlign: 'center', color: '#10b981' }}>
          ✓ Form submitted
        </div>
      </div>
    );
  }

  if (isExpired) {
    return (
      <div style={containerStyle}>
        <div style={{ textAlign: 'center', color: '#9ca3af' }}>
          This form has expired
        </div>
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      <h3 style={{ 
        margin: '0 0 8px 0', 
        fontSize: '16px', 
        fontWeight: 600,
        color: theme === 'light' ? '#1f2937' : '#f3f4f6',
      }}>
        {metadata.templateName}
      </h3>
      {metadata.templateDescription && (
        <p style={{ 
          margin: '0 0 16px 0', 
          fontSize: '14px',
          color: theme === 'light' ? '#6b7280' : '#9ca3af',
        }}>
          {metadata.templateDescription}
        </p>
      )}
      <form onSubmit={handleSubmit}>
        {fields.map(renderField)}
        <button type="submit" style={buttonStyle} disabled={isDisabled}>
          {isSubmitting ? 'Submitting...' : 'Submit'}
        </button>
      </form>
    </div>
  );
};
