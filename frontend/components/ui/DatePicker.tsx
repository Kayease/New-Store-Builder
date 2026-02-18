"use client";
//@ts-nocheck
import * as React from 'react';
import { DatePicker as MuiDatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { TextField } from '@mui/material';
import dayjs, { Dayjs } from 'dayjs';

interface DatePickerProps {
  label: string;
  value?: string | Dayjs | null;
  onChange: (value: Dayjs | null) => void;
  error?: boolean;
  helperText?: string;
  disabled?: boolean;
  minDate?: Dayjs;
  maxDate?: Dayjs;
  className?: string;
}

export default function DatePicker({
  label,
  value,
  onChange,
  error = false,
  helperText,
  disabled = false,
  minDate,
  maxDate,
  className,
}: DatePickerProps) {
  // Convert string value to dayjs object
  const dayjsValue = React.useMemo(() => {
    if (!value) return null;
    if (dayjs.isDayjs(value)) return value;
    return dayjs(value);
  }, [value]);

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <MuiDatePicker
        label={label}
        value={dayjsValue}
        onChange={onChange}
        disabled={disabled}
        minDate={minDate}
        maxDate={maxDate}
        className={className}
        slotProps={{
          textField: {
            fullWidth: true,
            error,
            helperText,
            InputLabelProps: { shrink: true },
          },
        }}
        renderInput={(params) => <TextField {...params} />}
      />
    </LocalizationProvider>
  );
}
