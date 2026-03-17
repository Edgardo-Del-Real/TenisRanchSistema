import { IsString, Matches, IsInt, Min } from 'class-validator';

export class UpdateConfiguracionDto {
  @IsString()
  @Matches(/^([0-1][0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/, {
    message: 'apertura debe tener formato HH:mm:ss',
  })
  apertura: string;

  @IsString()
  @Matches(/^([0-1][0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/, {
    message: 'cierre debe tener formato HH:mm:ss',
  })
  cierre: string;

  @IsString()
  @Matches(/^([0-1][0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/, {
    message: 'luz_inicio debe tener formato HH:mm:ss',
  })
  luz_inicio: string;

  @IsString()
  @Matches(/^([0-1][0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/, {
    message: 'luz_fin debe tener formato HH:mm:ss',
  })
  luz_fin: string;

  @IsInt()
  @Min(1, { message: 'duracion_semana_min debe ser al menos 1 minuto' })
  duracion_semana_min: number;

  @IsInt()
  @Min(1, { message: 'duracion_finde_min debe ser al menos 1 minuto' })
  duracion_finde_min: number;
}
