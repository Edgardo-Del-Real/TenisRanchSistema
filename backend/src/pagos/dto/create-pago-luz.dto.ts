import { IsString, IsNumber, IsPositive, Min, IsOptional } from 'class-validator';

export class CreatePagoLuzDto {
  @IsNumber({}, { message: 'El monto debe ser un número válido' })
  @IsPositive({ message: 'El monto debe ser mayor a 0' })
  @Min(0.01, { message: 'El monto debe ser mayor a 0' })
  monto: number;

  @IsOptional()
  @IsString({ message: 'La descripción debe ser un texto válido' })
  descripcion?: string;
}