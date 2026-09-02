import { Controller, type Control, type FieldPath, type FieldValues } from 'react-hook-form'
import { DatePicker, type DatePickerProps } from '@mui/x-date-pickers/DatePicker'
import dayjs, { type Dayjs } from 'dayjs'

interface FormDatePickerProps<TFieldValues extends FieldValues>
  extends Omit<DatePickerProps<Dayjs>, 'value' | 'onChange' | 'name'> {
  name: FieldPath<TFieldValues>
  control: Control<TFieldValues>
  helperText?: string
}

/** Stores an ISO date string (YYYY-MM-DD) in form state; the picker itself works in Dayjs. */
export function FormDatePicker<TFieldValues extends FieldValues>({
  name,
  control,
  helperText,
  slotProps,
  ...rest
}: FormDatePickerProps<TFieldValues>) {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => (
        <DatePicker
          {...rest}
          value={field.value ? dayjs(field.value as string) : null}
          onChange={(date) => field.onChange(date && date.isValid() ? date.format('YYYY-MM-DD') : null)}
          slotProps={{
            ...slotProps,
            textField: {
              fullWidth: true,
              error: Boolean(fieldState.error),
              helperText: fieldState.error?.message ?? helperText,
              ...(slotProps?.textField as object),
            },
          }}
        />
      )}
    />
  )
}
