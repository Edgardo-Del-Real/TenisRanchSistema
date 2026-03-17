import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  UpdateDateColumn,
} from 'typeorm';
import { EstadoCancha } from '../common/enums/estado-cancha.enum';

@Entity('canchas')
export class Cancha {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  numero: number;

  @Column({ type: 'varchar', length: 50, default: EstadoCancha.DISPONIBLE })
  estado: EstadoCancha;

  @Column({ name: 'razon_estado', length: 500, nullable: true })
  razon_estado: string;

  @UpdateDateColumn({ name: 'updated_at' })
  updated_at: Date;
}
