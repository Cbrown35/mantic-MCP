export interface MauticForm {
  id: number;
  name: string;
  alias?: string;
  description?: string;
  isPublished: boolean;
  publishUp?: string;
  publishDown?: string;
  dateAdded?: string;
  createdBy?: string;
  submissionCount?: number;
  fields?: any[];
}
