import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Rol } from '../../common/enums/rol.enum';

@Injectable()
export class OwnerOrAdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const paramId = request.params?.id;

    if (!user) {
      throw new ForbiddenException({
        error: {
          code: 'ACCESO_DENEGADO',
          message: 'No tiene permisos para realizar esta acción.',
        },
      });
    }

    if (user.rol === Rol.ADMINISTRADOR || user.sub === paramId) {
      return true;
    }

    throw new ForbiddenException({
      error: {
        code: 'ACCESO_DENEGADO',
        message: 'No tiene permisos para realizar esta acción.',
      },
    });
  }
}
