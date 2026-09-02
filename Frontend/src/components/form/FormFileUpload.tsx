import { Controller, type Control, type FieldPath, type FieldValues } from 'react-hook-form'
import { FileUploadField } from '@/components/common/FileUploadField'

interface FormFileUploadProps<TFieldValues extends FieldValues> {
  name: FieldPath<TFieldValues>
  control: Control<TFieldValues>
  accept?: string
  maxSizeMB?: number
  label?: string
  helperText?: string
}

export function FormFileUpload<TFieldValues extends FieldValues>({
  name,
  control,
  ...rest
}: FormFileUploadProps<TFieldValues>) {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => (
        <FileUploadField
          value={(field.value as File | null) ?? null}
          onChange={field.onChange}
          error={fieldState.error?.message}
          {...rest}
        />
      )}
    />
  )
}
