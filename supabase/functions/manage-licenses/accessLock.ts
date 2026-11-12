export const isAccessLocked = (statuses: string[]): boolean =>
  statuses.length > 0 && statuses.every((status) => status === 'suspended');