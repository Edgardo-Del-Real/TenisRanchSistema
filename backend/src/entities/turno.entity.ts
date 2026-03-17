import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { EstadoTurno } from '../common/enums/estado-turno.enum';
import { Usuario } from './usuario.entity';
import { Cancha } from './cancha.entity';
import { PagoTurno } from './pago-turno.entity';

@Entity('turnos')
export class Turno {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'usuario_id' })
  usuario_id: string;

  @ManyToOne(() => Usuario)
  @JoinColumn({ name: 'usuario_id' })
  usuario: Usuario;

  @Column({ name: 'cancha_id' })
  cancha_id: string;

  @ManyToOne(() => Cancha)
  @JoinColumn({ name: 'cancha_id' })
  cancha: Cancha;

  @Column({ name: 'fecha_inicio', type: 'datetime2' })
  fecha_inicio: Date;

  @Column({ name: 'fecha_fin', type: 'datetime2' })
  fecha_fin: Date;

  @Column({ name: 'requiere_luz', default: false })
  requiere_luz: boolean;

  @Column({ name: 'costo_turno', type: 'decimal', precision: 10, scale: 2, default: 0 })
  costo_turno: number;

  @Column({ name: 'costo_luz', type: 'decimal', precision: 10, scale: 2, default: 0 })
  costo_luz: number;

  @Column({ type: 'varchar', length: 50, default: EstadoTurno.ACTIVO })
  estado: EstadoTurno;

  @Column({ name: 'cancelado_en', type: 'datetime2', nullable: true })
  cancelado_en: Date;

  @Column({ name: 'cancelado_por', nullable: true })
  cancelado_por: string;

  @ManyToOne(() => Usuario, { nullable: true })
  @JoinColumn({ name: 'cancelado_por' })
  cancelado_por_usuario: Usuario;

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;

  @OneToOne(() => PagoTurno, pagoTurno => pagoTurno.turno, { nullable: true })
  pago_turno: PagoTurno;
}
