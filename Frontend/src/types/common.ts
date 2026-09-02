/** Spring Data's own pagination envelope — returned by GET /users (0-indexed page). */
export interface SpringPage<T> {
  content: T[]
  totalElements: number
  totalPages: number
  number: number
  size: number
  first: boolean
  last: boolean
}

/**
 * The custom pagination envelope used by most other list endpoints in the
 * API spec (GET /jobs, GET /jobs/{id}/applications, GET /jobs/{id}/ranking, …).
 * `page` here is 1-indexed, per the spec's own examples (page=1 is first page).
 */
export interface ListEnvelope<T> {
  data: T[]
  totalRecords?: number
  page?: number
  size?: number
}

export interface ApiErrorBody {
  errorCode?: string
  message: string
}

export interface PageQuery {
  page?: number
  size?: number
}

export type SortDirection = 'asc' | 'desc'
