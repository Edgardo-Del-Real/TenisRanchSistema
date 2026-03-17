import { IsEnum, IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { EstadoCancha } from '../../common/enums/estado-cancha.enum';

export class UpdateEstadoCanchaDto {
  @IsEnum(EstadoCancha)
  @IsNotEmpty()
  estado: EstadoCancha;

  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  razon: string;
}
