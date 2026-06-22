'use client';

import React from 'react';

export interface SwitchProps {
  checked: boolean;
  onChange?: (checked: boolean) => void;
  onCheckedChange?: (checked: boolean) => void;
  disabled?: boolean;
  label?: string;
  className?: string;
}

export const Switch: React.FC<SwitchProps> = ({
  checked,
  onChange,
  onCheckedChange,
  disabled = false,
  label,
  className = '',
}) => {
  const handleChange = onChange || onCheckedChange;
  return (
    <label
      className={`flex items-center gap-2 cursor-pointer ${disabled ? 'opacity-50' : ''} ${className}`}
    >
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => handleChange?.(!checked)}
        className={`
          relative inline-flex h-6 w-11 items-center rounded-full transition-colors
          ${checked ? 'bg-primary' : 'bg-gray-300'}
          ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}
        `}
      >
        <span
          className={`
            inline-block h-4 w-4 transform rounded-full bg-white transition-transform
            ${checked ? 'translate-x-6' : 'translate-x-1'}
          `}
        />
      </button>
      {label && <span className="text-sm">{label}</span>}
    </label>
  );
};
