import type { InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export function Input({ label, error, id, className = '', ...props }: InputProps) {
  const inputId = id ?? props.name ?? label.toLowerCase().replace(/\s+/g, '-');

  return (
    <div className="field">
      <label htmlFor={inputId} className="field__label">
        {label}
      </label>
      <input
        id={inputId}
        className={`input ${error ? 'input--error' : ''} ${className}`.trim()}
        {...props}
      />
      {error ? <span className="field__error">{error}</span> : null}
    </div>
  );
}
