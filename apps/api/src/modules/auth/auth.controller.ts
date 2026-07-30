import { Body, Controller, Get, HttpCode, HttpStatus, Ip, Post, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import type { AuthenticatedUser, LoginResponse } from '@redsis/contracts';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import type { RequestUser } from '../../common/types/request-user';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';

@ApiTags('Autenticación')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Iniciar sesión y obtener el par de tokens' })
  login(
    @Body() body: LoginDto,
    @Req() request: Request,
    @Ip() ipAddress: string,
  ): Promise<LoginResponse> {
    return this.authService.login(body.email, body.password, {
      userAgent: request.headers['user-agent'],
      ipAddress,
    });
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Renovar la sesión',
    description: 'El refresh token se rota: el anterior queda revocado.',
  })
  refresh(
    @Body() body: RefreshTokenDto,
    @Req() request: Request,
    @Ip() ipAddress: string,
  ): Promise<LoginResponse> {
    return this.authService.refresh(body.refreshToken, {
      userAgent: request.headers['user-agent'],
      ipAddress,
    });
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cerrar la sesión indicada' })
  logout(
    @Body() body: RefreshTokenDto,
    @CurrentUser() user: RequestUser,
    @Ip() ipAddress: string,
  ): Promise<void> {
    return this.authService.logout(body.refreshToken, user.id, ipAddress);
  }

  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtener el usuario autenticado con sus permisos efectivos' })
  me(@CurrentUser() user: RequestUser): Promise<AuthenticatedUser> {
    return this.authService.currentUser(user.id);
  }
}
