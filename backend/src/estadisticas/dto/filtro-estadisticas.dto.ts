import { IsOptional, IsDateString } from 'class-validator';

export class FiltroEstadisticasDto {
  @IsOptional()
  @IsDateString()
  fechaInicio?: string;

  @IsOptional()
  @IsDateString()
  fechaFin?: string;
}