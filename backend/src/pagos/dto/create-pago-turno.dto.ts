import { IsString, IsNumber, IsPositive, Min, Matches } from 'class-validator';

export class CreatePagoTurnoDto {
  @IsString()
  @Matches(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i, {
    message: 'turno_id must be a valid UUID',
  })
  turno_id: string;

  @IsNumber({}, { message: 'El monto debe ser un número válido' })
  @IsPositive({ message: 'El monto debe ser mayor a 0' })
  @Min(0.01, { message: 'El monto debe ser mayor a 0' })
  monto: number;

  @IsString({ message: 'El método de pago es requerido' })
  metodo_pago: string;
}