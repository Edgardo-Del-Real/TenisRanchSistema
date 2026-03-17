import { IsNumber, IsPositive, Min } from 'class-validator';

export class CreatePagoCuotaDto {
  @IsNumber({}, { message: 'El monto debe ser un número válido' })
  @IsPositive({ message: 'El monto debe ser mayor a 0' })
  @Min(0.01, { message: 'El monto debe ser mayor a 0' })
  monto: number;
}