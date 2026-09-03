import { Box } from '@mui/material'
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { BRAND } from '@/theme/palette'

const FUNNEL_COLORS = ['#14213D', '#2C3E63', '#5C6784', '#C98A2E', '#FCA311', '#16A34A']

export interface FunnelDatum {
  stage: string
  value: number
}

/** Shared brand-colored funnel bar chart. `layout="vertical"` renders horizontal bars. */
export function FunnelChart({
  data,
  height = 320,
  layout = 'horizontal',
}: {
  data: FunnelDatum[]
  height?: number
  layout?: 'horizontal' | 'vertical'
}) {
  const vertical = layout === 'vertical'
  return (
    <Box sx={{ width: '100%', height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout={layout} margin={{ top: 8, left: vertical ? 12 : 4, right: 24 }}>
          <CartesianGrid horizontal={!vertical} vertical={vertical} stroke={BRAND.border} />
          {vertical ? (
            <>
              <XAxis type="number" tick={{ fontSize: 12, fill: BRAND.slate }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="stage" tick={{ fontSize: 12, fill: BRAND.charcoal }} axisLine={false} tickLine={false} width={90} />
            </>
          ) : (
            <>
              <XAxis dataKey="stage" tick={{ fontSize: 12, fill: BRAND.charcoal }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: BRAND.slate }} axisLine={false} tickLine={false} />
            </>
          )}
          <Tooltip
            cursor={{ fill: 'rgba(107,124,152,0.06)' }}
            contentStyle={{ borderRadius: 10, border: `1px solid ${BRAND.border}`, fontSize: 13 }}
          />
          <Bar dataKey="value" radius={vertical ? [0, 6, 6, 0] : [6, 6, 0, 0]} barSize={vertical ? 22 : 44}>
            {data.map((_, i) => (
              <Cell key={i} fill={FUNNEL_COLORS[i % FUNNEL_COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </Box>
  )
}
