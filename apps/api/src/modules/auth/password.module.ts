import { Module } from '@nestjs/common';
import { PasswordService } from './password.service';

/**
 * Módulo propio para que Usuarios pueda hashear contraseñas sin importar
 * el módulo de autenticación completo (evita una dependencia circular).
 */
@Module({
  providers: [PasswordService],
  exports: [PasswordService],
})
export class PasswordModule {}
