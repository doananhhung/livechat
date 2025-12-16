// src/rbac/roles.decorator.ts

import { SetMetadata } from '@nestjs/common';
import { GlobalRole, ProjectRole } from '@social-commerce/shared';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: (GlobalRole | ProjectRole)[]) =>
  SetMetadata(ROLES_KEY, roles);
