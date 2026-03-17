import { IsEnum } from 'class-validator';
import { Rol } from '../../common/enums/rol.enum';

export class UpdateRolDto {
  @IsEnum(Rol)
  rol: Rol;
}
