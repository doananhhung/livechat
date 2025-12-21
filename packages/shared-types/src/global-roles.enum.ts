/**
 * Global roles for application-level access control
 * These roles determine access to system features like admin dashboard
 */
export enum GlobalRole {
  ADMIN = "admin", // Full system access, can access admin dashboard
  USER = "user", // Regular user, can use all application features
}
