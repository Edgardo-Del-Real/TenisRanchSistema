import { IsOptional, IsString, MinLength } from 'class-validator';

export class UpdatePerfilDto {
  @IsOptional()
  @IsString()
  nombre?: string;

  @IsOptional()
  @IsString()
  telefono?: string;

  @IsOptional()
  @IsString()
  @MinLength(8)
  password?: string;
}
