let counter = 0

/** Monotonic, collision-resistant id for windows and transient UI. */
export function uid(prefix = 'id'): string {
  counter += 1
  return `${prefix}-${Date.now().toString(36)}-${counter.toString(36)}`
}
