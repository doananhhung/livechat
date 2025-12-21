export enum InvitationStatus {
  PENDING = "pending",
  ACCEPTED = "accepted",
  EXPIRED = "expired",
}

export interface Invitation {
  id: number;
  email: string;
  projectId: number;
  role: string; // or ProjectRole
  status: InvitationStatus;
  token: string;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}
