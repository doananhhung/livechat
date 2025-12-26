import { Request } from 'express';

/**
 * Interface representing a user object, typically attached to the request
 * after authentication.
 */
export interface AuthenticatedUser {
  id: string;
  // Add other common user properties if known, e.g., email, roles
  // email: string;
  // roles: string[];
}

/**
 * Extends the Express Request interface to include an authenticated user object.
 * This is useful for strictly typing requests that have gone through authentication middleware.
 */
export interface RequestWithUser extends Request {
  user?: AuthenticatedUser;
}
