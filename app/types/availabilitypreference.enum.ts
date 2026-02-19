export const availabilityPreferences = ["unavailable", "available", "preferred"] as const;
export type AvailabilityPreference = typeof availabilityPreferences[number]