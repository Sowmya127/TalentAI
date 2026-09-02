/**
 * The axios response interceptor runs outside React Router's context, so
 * it can't navigate directly. It emits here instead; AuthProvider (which
 * does have router access) subscribes once and performs the redirect.
 */
type SessionEventType = 'unauthorized'

const target = new EventTarget()

export const sessionEvents = {
  emit(type: SessionEventType): void {
    target.dispatchEvent(new Event(type))
  },
  subscribe(type: SessionEventType, handler: () => void): () => void {
    target.addEventListener(type, handler)
    return () => target.removeEventListener(type, handler)
  },
}
