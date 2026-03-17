import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { EstadoCancha } from '../common/enums/estado-cancha.enum';
import { Cancha } from './cancha.entity';
import { Usuario } from './usuario.entity';

@Entity('historial_cancha')
export class HistorialCancha {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'cancha_id' })
  cancha_id: string;

  @ManyToOne(() => Cancha)
  @JoinColumn({ name: 'cancha_id' })
  cancha: Cancha;

  @Column({ name: 'estado_anterior', type: 'varchar', length: 50 })
  estado_anterior: EstadoCancha;

  @Column({ name: 'estado_nuevo', type: 'varchar', length: 50 })
  estado_nuevo: EstadoCancha;

  @Column({ length: 500, nullable: true })
  razon: string;

  @Column({ name: 'cambiado_por' })
  cambiado_por: string;

  @ManyToOne(() => Usuario)
  @JoinColumn({ name: 'cambiado_por' })
  cambiado_por_usuario: Usuario;

  @CreateDateColumn({ name: 'fecha_cambio' })
  fecha_cambio: Date;
}
