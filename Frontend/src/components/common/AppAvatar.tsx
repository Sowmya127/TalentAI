import { Avatar, type AvatarProps } from '@mui/material'
import { colorFromString, getInitials } from '@/utils/formatters'

interface AppAvatarProps extends Omit<AvatarProps, 'children'> {
  firstName?: string | null
  lastName?: string | null
  src?: string
  size?: number
}

export function AppAvatar({ firstName, lastName, src, size = 36, sx, ...rest }: AppAvatarProps) {
  const initials = getInitials(firstName, lastName)
  const bg = colorFromString(`${firstName ?? ''}${lastName ?? ''}` || 'talentai')

  return (
    <Avatar
      src={src}
      sx={{
        width: size,
        height: size,
        fontSize: size * 0.4,
        fontWeight: 600,
        bgcolor: src ? undefined : bg,
        ...sx,
      }}
      {...rest}
    >
      {!src ? initials : null}
    </Avatar>
  )
}
