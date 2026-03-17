import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Turno } from './turno.entity';
import { Usuario } from './usuario.entity';

@Entity('pagos_turno')
export class PagoTurno {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'turno_id' })
  turno_id: string;

  @ManyToOne(() => Turno)
  @JoinColumn({ name: 'turno_id' })
  turno: Turno;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  monto: number;

  @Column({ name: 'metodo_pago', length: 50 })
  metodo_pago: string;

  @Column({ name: 'fecha_pago', type: 'timestamptz' })
  fecha_pago: Date;

  @Column({ name: 'registrado_por' })
  registrado_por: string;

  @ManyToOne(() => Usuario)
  @JoinColumn({ name: 'registrado_por' })
  registrado_por_usuario: Usuario;
}
