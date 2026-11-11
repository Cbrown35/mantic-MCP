export interface MauticEmail {
  id: number;
  name: string;
  subject?: string;
  fromAddress?: string;
  fromName?: string;
  replyToAddress?: string;
  customHtml?: string;
  /** MJML source kept by Mautic's GrapesJS builder, returned when the email has one. */
  grapesjsbuilder?: { customMjml?: string };
  plainText?: string;
  template?: string;
  emailType?: string;
  publishUp?: string;
  publishDown?: string;
  readCount?: number;
  sentCount?: number;
  revision?: number;
  assetAttachments?: any[];
  variantStartDate?: string;
  variantSentCount?: number;
  variantReadCount?: number;
  variantClickCount?: number;
  variantUnsubscribedCount?: number;
  variantBounceCount?: number;
}
