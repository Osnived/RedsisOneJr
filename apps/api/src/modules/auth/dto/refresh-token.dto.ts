import { ApiProperty } from '@nestjs/swagger';
import { IsJWT } from 'class-validator';
import type { RefreshTokenInput } from '@redsis/contracts';

export class RefreshTokenDto implements RefreshTokenInput {
  @ApiProperty({ description: 'Refresh token entregado en el login' })
  @IsJWT({ message: 'El refresh token no tiene un formato válido' })
  refreshToken!: string;
}
