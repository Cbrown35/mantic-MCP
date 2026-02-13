export interface MauticProject {
  id: number;
  name: string;
  description?: string;
  properties?: Record<string, any>;
}
