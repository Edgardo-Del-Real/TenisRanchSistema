import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { EstadoCuota } from '../common/enums/estado-cuota.enum';
import { Usuario } from './usuario.entity';

@Entity('cuotas')
export class Cuota {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'socio_id' })
  socio_id: string;

  @ManyToOne(() => Usuario)
  @JoinColumn({ name: 'socio_id' })
  socio: Usuario;

  @Column()
  mes: number;

  @Column()
  anio: number;

  @Column({ name: 'monto_total', type: 'decimal', precision: 10, scale: 2 })
  monto_total: number;

  @Column({ name: 'monto_abonado', type: 'decimal', precision: 10, scale: 2, default: 0 })
  monto_abonado: number;

  @Column({ type: 'varchar', length: 50, default: EstadoCuota.PENDIENTE })
  estado: EstadoCuota;

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;
}
