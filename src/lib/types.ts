import type { FieldValue, Timestamp } from "firebase/firestore";

export type UserRole = "admin" | "editor";

export interface UserProfile {
  id: string;
  displayName: string;
  email: string;
  role: UserRole;
}

export type AdZone = "top" | "bottom";

export interface AdDocument {
  id: string;
  zone: AdZone;
  imageUrl: string;
  clickUrl: string;
  weight: number;
  createdAt?: Timestamp | FieldValue;
}

export interface MastheadRecord {
  imageData: string;
  updatedAt?: Timestamp | FieldValue;
  updatedBy?: string;
}

export interface PosterExportLog {
  userId: string;
  template: string;
  headlineLen: number;
  createdAt: Timestamp | FieldValue;
}
