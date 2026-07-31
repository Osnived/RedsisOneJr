import { Injectable, UnauthorizedException } from '@nestjs/common';
import {
  ACTIVITY_ACTIONS,
  MODULES,
  type AuthenticatedUser,
  type JwtPayload,
  type LoginResponse,
} from '@redsis/contracts';
import { ActivityLogService } from '../activity-log/activity-log.service';
import { UserRepository } from '../users/user.repository';
import type { UserWithAccess, UserWithCredentials } from '../users/user.types';
import { PasswordService } from './password.service';
import { SessionRepository } from './session.repository';
import { TokenService } from './token.service';

export interface LoginContext {
  userAgent?: string;
  ipAddress?: string;
}

/**
 * Flujo de autenticación: login, rotación de refresh token y cierre de sesión.
 *
 * La autenticación es propia (JWT). No se utiliza el sistema de autenticación
 * de Supabase: Supabase es únicamente el proveedor de PostgreSQL (ver STACK.md).
 */
@Injectable()
export class AuthService {
  constructor(
    private readonly users: UserRepository,
    private readonly sessions: SessionRepository,
    private readonly passwordService: PasswordService,
    private readonly tokenService: TokenService,
    private readonly activityLog: ActivityLogService,
  ) {}

  async login(email: string, password: string, context: LoginContext = {}): Promise<LoginResponse> {
    const user = await this.users.findByEmail(email);
    const isValid = await this.verifyCredentials(user, password);

    // Un mensaje único para credenciales inválidas y usuario inexistente:
    // no se revela qué correos están registrados.
    if (!user || !isValid) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('La cuenta está desactivada');
    }

    const tokens = await this.issueSession(user, context);
    const now = new Date();

    await this.users.registerLogin(user.id, now);
    await this.activityLog.record({
      userId: user.id,
      action: ACTIVITY_ACTIONS.LOGIN,
      module: MODULES.USERS,
      entityId: user.id,
      ipAddress: context.ipAddress,
    });

    return { user: toAuthenticatedUser(user), tokens };
  }

  /**
   * Rota el refresh token: el anterior se revoca al emitir el nuevo.
   * Así un token robado deja de servir en cuanto el usuario legítimo lo usa.
   */
  async refresh(refreshToken: string, context: LoginContext = {}): Promise<LoginResponse> {
    const payload = await this.tokenService.verifyRefreshToken(refreshToken);
    const tokenHash = this.tokenService.hashRefreshToken(refreshToken);
    const session = await this.sessions.findActiveByTokenHash(tokenHash);

    if (!session || session.userId !== payload.sub) {
      throw new UnauthorizedException('La sesión no existe o ya fue cerrada');
    }

    const user = await this.users.findById(payload.sub);

    if (!user || !user.isActive) {
      throw new UnauthorizedException('La cuenta ya no está habilitada');
    }

    await this.sessions.revokeById(session.id, new Date());
    const tokens = await this.issueSession(user, context);

    return { user: toAuthenticatedUser(user), tokens };
  }

  async logout(refreshToken: string, userId: string, ipAddress?: string): Promise<void> {
    const tokenHash = this.tokenService.hashRefreshToken(refreshToken);
    const session = await this.sessions.findActiveByTokenHash(tokenHash);

    // Cerrar una sesión ya cerrada no es un error: el resultado deseado se cumple.
    if (session) {
      await this.sessions.revokeById(session.id, new Date());
    }

    await this.activityLog.record({
      userId,
      action: ACTIVITY_ACTIONS.LOGOUT,
      module: MODULES.USERS,
      entityId: userId,
      ipAddress,
    });
  }

  async currentUser(userId: string): Promise<AuthenticatedUser> {
    const user = await this.users.findById(userId);

    if (!user || !user.isActive) {
      throw new UnauthorizedException('La cuenta ya no está habilitada');
    }

    return toAuthenticatedUser(user);
  }

  private async issueSession(user: UserWithAccess, context: LoginContext) {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      permissions: user.permissions,
      roles: user.roles,
      modules: user.modules,
    };

    const tokens = await this.tokenService.issue(payload);

    await this.sessions.create({
      userId: user.id,
      refreshTokenHash: this.tokenService.hashRefreshToken(tokens.refreshToken),
      expiresAt: this.tokenService.refreshTokenExpiration(tokens.refreshToken),
      userAgent: context.userAgent ?? null,
      ipAddress: context.ipAddress ?? null,
    });

    return tokens;
  }

  /**
   * Se compara siempre contra un hash, incluso si el usuario no existe, para que
   * el tiempo de respuesta no delate qué correos están registrados.
   */
  private async verifyCredentials(
    user: UserWithCredentials | null,
    password: string,
  ): Promise<boolean> {
    const hashToCompare = user?.passwordHash ?? DUMMY_PASSWORD_HASH;
    const matches = await this.passwordService.compare(password, hashToCompare);

    return user !== null && matches;
  }
}

/** Hash de una contraseña aleatoria: nunca coincide, solo consume tiempo. */
const DUMMY_PASSWORD_HASH = '$2b$12$C6UzMDM.H6dfI/f/IKcEe.rWgn79ZFY0YkTKtVCVWiVSNwbGVLLLu';

function toAuthenticatedUser(user: UserWithAccess): AuthenticatedUser {
  return {
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    isActive: user.isActive,
    roles: user.roles,
    modules: user.modules,
    permissions: user.permissions,
  };
}
