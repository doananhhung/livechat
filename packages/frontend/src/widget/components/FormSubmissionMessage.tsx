import { h } from 'preact';
import { useMemo } from 'preact/hooks';
import type { FormSubmissionMetadata } from '@live-chat/shared-types';

interface FormSubmissionMessageProps {
  metadata: FormSubmissionMetadata;
  theme: 'light' | 'dark';
  isFromVisitor: boolean;
  primaryColor?: string;
}

/**
 * Renders a submitted form as a read-only display in chat.
 */
export const FormSubmissionMessage = ({
  metadata,
  theme,
  isFromVisitor,
  primaryColor,
}: FormSubmissionMessageProps) => {
  const containerStyle = useMemo(() => ({
    backgroundColor: isFromVisitor 
      ? (primaryColor || '#2563eb')
      : (theme === 'light' ? '#dcfce7' : '#14532d'),
    color: isFromVisitor 
      ? '#ffffff' 
      : (theme === 'light' ? '#166534' : '#bbf7d0'),
    borderRadius: '16px',
    border: '2px solid',
    borderColor: isFromVisitor ? 'transparent' : (theme === 'light' ? '#86efac' : '#166534'),
    padding: '24px',
    maxWidth: '400px',
    width: '100%',
    margin: '8px auto',
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
  }), [theme, isFromVisitor, primaryColor]);

  const labelStyle = useMemo(() => ({
    fontSize: '12px',
    fontWeight: 600,
    opacity: 0.8,
    marginBottom: '2px',
  }), []);

  const valueStyle = useMemo(() => ({
    fontSize: '14px',
    marginBottom: '8px',
  }), []);

  const entries = Object.entries(metadata.data);

  return (
    <div style={containerStyle}>
      <div style={{ 
        fontSize: '12px', 
        fontWeight: 600, 
        marginBottom: '8px',
        opacity: 0.9,
      }}>
        ✓ {metadata.templateName}
      </div>
      {entries.map(([key, value]) => (
        <div key={key}>
          <div style={labelStyle}>{key}</div>
          <div style={valueStyle}>
            {typeof value === 'boolean' 
              ? (value ? 'Yes' : 'No') 
              : String(value ?? '-')}
          </div>
        </div>
      ))}
    </div>
  );
};
