// src/rbac/roles.decorator.ts

import { SetMetadata } from '@nestjs/common';
import { Role } from '@social-commerce/shared';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
