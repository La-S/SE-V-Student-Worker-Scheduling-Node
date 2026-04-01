export const announcementPriorities = ["low", "medium", "high"] as const;
export type AnnouncementPriority = typeof announcementPriorities[number]