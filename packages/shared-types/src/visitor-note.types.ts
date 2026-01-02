import { User } from "./user.types";

export interface VisitorNote {
  id: string;
  visitorId: number;
  authorId: string;
  author?: User;
  content: string;
  createdAt: Date | string;
  updatedAt: Date | string;
}
