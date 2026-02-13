export interface MauticSegment {
  id: number;
  name: string;
  alias?: string;
  description?: string;
  isPublished: boolean;
  isGlobal: boolean;
  filters?: any[];
  dateAdded?: string;
  createdBy?: string;
}
