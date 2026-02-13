export interface MauticCampaign {
  id: number;
  name: string;
  description?: string;
  isPublished: boolean;
  publishUp?: string;
  publishDown?: string;
  dateAdded?: string;
  createdBy?: string;
  stats?: {
    sentCount: number;
    readCount: number;
    clickCount: number;
  };
}
