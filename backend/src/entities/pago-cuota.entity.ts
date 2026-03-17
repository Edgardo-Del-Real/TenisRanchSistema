import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { Cuota } from './cuota.entity';
import { Usuario } from './usuario.entity';

@Entity('pagos_cuota')
export class PagoCuota {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'cuota_id' })
  cuota_id: string;

  @ManyToOne(() => Cuota)
  @JoinColumn({ name: 'cuota_id' })
  cuota: Cuota;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  monto: number;

  @Column({ name: 'fecha_pago', type: 'datetime2' })
  fecha_pago: Date;

  @Column({ name: 'registrado_por' })
  registrado_por: string;

  @ManyToOne(() => Usuario)
  @JoinColumn({ name: 'registrado_por' })
  registrado_por_usuario: Usuario;
}
