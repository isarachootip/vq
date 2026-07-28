import React, { useRef } from 'react';
import { Calendar } from 'lucide-react';

export const formatDateDDMMYYYY = (dateStr: string | null | undefined): string => {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  const [year, month, day] = parts;
  return `${day.padStart(2, '0')}/${month.padStart(2, '0')}/${year}`;
};

interface CustomDateInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  required?: boolean;
  min?: string;
  max?: string;
  id?: string;
  iconPosition?: 'left' | 'right';
}

export const CustomDateInput: React.FC<CustomDateInputProps> = ({
  value,
  onChange,
  placeholder = 'DD/MM/YYYY',
  className = '',
  required,
  min,
  max,
  id,
  iconPosition = 'right',
}) => {
  const dateInputRef = useRef<HTMLInputElement>(null);

  const displayValue = formatDateDDMMYYYY(value);

  const openPicker = () => {
    const el = dateInputRef.current as any;
    if (el) {
      if ('showPicker' in el) {
        try {
          el.showPicker();
        } catch {
          el.click();
        }
      } else {
        el.click();
      }
    }
  };

  return (
    <div className="relative flex items-center w-full">
      <input
        type="text"
        readOnly
        required={required}
        value={displayValue}
        placeholder={placeholder}
        onClick={openPicker}
        className={`cursor-pointer ${iconPosition === 'left' ? 'pl-9 pr-3' : 'pr-9 pl-3'} ${className}`}
      />
      <Calendar
        size={16}
        onClick={openPicker}
        className={`text-slate-400 absolute ${iconPosition === 'left' ? 'left-3' : 'right-3'} top-1/2 -translate-y-1/2 cursor-pointer hover:text-slate-600`}
      />
      <input
        id={id}
        ref={dateInputRef}
        type="date"
        value={value || ''}
        min={min}
        max={max}
        onChange={(e) => onChange(e.target.value)}
        className="opacity-0 pointer-events-none absolute bottom-0 left-0 w-0 h-0 border-0 p-0"
        tabIndex={-1}
      />
    </div>
  );
};
