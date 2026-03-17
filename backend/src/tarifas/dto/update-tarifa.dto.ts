import { IsNumber, IsPositive } from 'class-validator';

export class UpdateTarifaDto {
  @IsNumber()
  @IsPositive()
  valor: number;
}
