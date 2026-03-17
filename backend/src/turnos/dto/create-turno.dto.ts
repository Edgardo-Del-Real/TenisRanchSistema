import { IsString, IsDateString, Matches } from 'class-validator';

export class CreateTurnoDto {
  @IsString()
  @Matches(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i, {
    message: 'cancha_id must be a valid UUID',
  })
  cancha_id: string;

  @IsDateString()
  fecha_hora_inicio: string;
}
