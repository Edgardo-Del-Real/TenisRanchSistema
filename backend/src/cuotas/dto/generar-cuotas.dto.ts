import { IsNumber, IsPositive, Min } from 'class-validator';

export class GenerarCuotasDto {
  @IsNumber()
  @IsPositive()
  @Min(1)
  monto: number;
}