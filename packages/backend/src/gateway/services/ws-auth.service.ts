import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Socket } from 'socket.io';
import { UserService } from '../../users/user.service';
import { ProjectService } from '../../projects/project.service';

export interface WsAuthResult {
  valid: boolean;
  user?: { id: string; email: string };
  error?: string;
}

/**
 * Service responsible for validating WebSocket connections.
 * Extracts authentication and authorization logic from the Gateway
 * to keep the Gateway as a thin transport layer.
 */
@Injectable()
export class WsAuthService {
  private readonly logger = new Logger(WsAuthService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
    private readonly userService: UserService,
    private readonly projectService: ProjectService
  ) {}

  /**
   * Validates an incoming WebSocket connection.
   * Handles both agent (JWT) and widget/visitor (origin whitelist) connections.
   *
   * @param client The Socket.io client socket.
   * @returns Validation result with user info if authenticated.
   */
  async validateConnection(client: Socket): Promise<WsAuthResult> {
    const origin = client.handshake.headers.origin;
    const projectId = client.handshake.query.projectId;
    const authToken = client.handshake.auth?.token;
    const frontendUrl = this.configService.get<string>('FRONTEND_URL');

    // 1. Agent Authentication (JWT)
    if (authToken) {
      return this.validateAgentConnection(authToken);
    }

    // 2. Allow main frontend app without further checks
    if (origin === frontendUrl) {
      return { valid: true };
    }

    // 3. Widget/Visitor Connection - validate project and whitelist
    if (projectId && typeof projectId === 'string') {
      return this.validateWidgetConnection(+projectId, origin);
    }

    // No auth token, not frontend, no projectId - allow for now (backward compat)
    return { valid: true };
  }

  /**
   * Validates an agent connection using JWT.
   */
  private async validateAgentConnection(authToken: string): Promise<WsAuthResult> {
    try {
      const payload = this.jwtService.verify(authToken, {
        secret: this.configService.get<string>('JWT_SECRET'),
      });

      const user = await this.userService.findOneById(payload.sub);
      if (!user) {
        this.logger.warn(`Connection rejected: User ${payload.sub} not found.`);
        return { valid: false, error: 'User not found' };
      }

      // Check token revocation
      const tokensValidFromSec = Math.floor(user.tokensValidFrom.getTime() / 1000);
      if (payload.iat < tokensValidFromSec) {
        this.logger.warn(`Connection rejected: Token revoked for user ${user.email}`);
        return { valid: false, error: 'Token revoked' };
      }

      this.logger.log(`Agent authenticated: ${user.email}`);
      return { valid: true, user: { id: user.id, email: user.email } };
    } catch (error: any) {
      this.logger.warn(`Connection rejected: Invalid JWT. ${error.message}`);
      return { valid: false, error: 'Invalid JWT' };
    }
  }

  /**
   * Validates a widget connection by checking project existence and origin whitelist.
   */
  private async validateWidgetConnection(
    projectId: number,
    origin: string | undefined
  ): Promise<WsAuthResult> {
    const project = await this.projectService.findByProjectId(projectId);
    if (!project) {
      this.logger.warn(`Connection rejected: Project ${projectId} not found.`);
      return { valid: false, error: 'Project not found' };
    }

    if (!project.whitelistedDomains || project.whitelistedDomains.length === 0) {
      this.logger.warn(
        `Project ${projectId} has no whitelisted domains configured. WS connection denied for origin ${origin}.`
      );
      return { valid: false, error: 'No whitelisted domains' };
    }

    if (!origin) {
      this.logger.warn(`Connection rejected: Missing Origin header for project ${projectId}`);
      return { valid: false, error: 'Missing origin' };
    }

    try {
      const originUrl = new URL(origin);
      const originDomain = originUrl.hostname;

      if (!project.whitelistedDomains.includes(originDomain)) {
        this.logger.warn(
          `Connection rejected: Origin ${origin} not whitelisted for project ${projectId}`
        );
        return { valid: false, error: 'Origin not whitelisted' };
      }
    } catch (error) {
      this.logger.warn(`Connection rejected: Invalid Origin header ${origin}`);
      return { valid: false, error: 'Invalid origin' };
    }

    return { valid: true };
  }
}
