export interface Speaker {
  name: string;
  designation: string;
  organization: string;
}

export interface ExtractionConfidence {
  eventTitle: number;
  department: number;
  date: number;
  venue: number;
  speakers: number;
}

export interface OcrMetadata {
  rotationApplied: number;
  skewCorrected: number;
  ocrMethod: string;
}

export interface AutofillResponse {
  eventTitle: string;
  department: string;
  organizedBy: string;
  eventType: string;
  date: string;
  time: string;
  venue: string;
  speakers: Speaker[];
  confidence: ExtractionConfidence;
  metadata: OcrMetadata;
}

export interface LayoutBlock {
  id: string;
  text: string;
  bbox: [number, number, number, number]; // [x_min, y_min, x_max, y_max]
  type: "title" | "subtitle" | "department" | "date" | "venue" | "speaker" | "footer";
  confidence: number;
  readingOrder: number;
}
