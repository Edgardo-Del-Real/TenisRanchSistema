import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Usuario } from './usuario.entity';

@Entity('pagos_luz')
export class PagoLuz {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  monto: number;

  @Column({ name: 'fecha_pago', type: 'datetime2' })
  fecha_pago: Date;

  @Column({ length: 500, nullable: true })
  descripcion: string;

  @Column({ name: 'registrado_por' })
  registrado_por: string;

  @ManyToOne(() => Usuario)
  @JoinColumn({ name: 'registrado_por' })
  registrado_por_usuario: Usuario;
}
