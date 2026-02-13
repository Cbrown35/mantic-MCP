export interface MauticContact {
  id: number;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  company?: string;
  position?: string;
  dateAdded?: string;
  dateModified?: string;
  lastActive?: string;
  points: number;
  [key: string]: any;
}
