export const availabilityPreferences = ["preferred", "available", "unavailable"] as const;
export type AvailabilityPreference = typeof availabilityPreferences[number]