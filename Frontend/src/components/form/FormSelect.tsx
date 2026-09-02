import { Controller, type Control, type FieldPath, type FieldValues } from 'react-hook-form'
import { FormControl, FormHelperText, InputLabel, MenuItem, Select, type SelectProps } from '@mui/material'

export interface FormSelectOption {
  value: string
  label: string
}

interface FormSelectProps<TFieldValues extends FieldValues>
  extends Omit<SelectProps, 'name' | 'error' | 'defaultValue'> {
  name: FieldPath<TFieldValues>
  control: Control<TFieldValues>
  label: string
  options: FormSelectOption[]
  helperText?: string
}

export function FormSelect<TFieldValues extends FieldValues>({
  name,
  control,
  label,
  options,
  helperText,
  ...rest
}: FormSelectProps<TFieldValues>) {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => (
        <FormControl fullWidth error={Boolean(fieldState.error)}>
          <InputLabel id={`${name}-label`}>{label}</InputLabel>
          <Select {...field} value={field.value ?? ''} labelId={`${name}-label`} label={label} {...rest}>
            {options.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </Select>
          {(fieldState.error?.message ?? helperText) && (
            <FormHelperText>{fieldState.error?.message ?? helperText}</FormHelperText>
          )}
        </FormControl>
      )}
    />
  )
}
