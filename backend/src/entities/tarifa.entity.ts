import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { TipoTarifa } from '../common/enums/tipo-tarifa.enum';
import { Usuario } from './usuario.entity';

@Entity('tarifas')
export class Tarifa {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 50 })
  tipo: TipoTarifa;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  valor: number;

  @Column({ name: 'vigente_desde', type: 'timestamptz' })
  vigente_desde: Date;

  @Column({ name: 'modificado_por', nullable: true })
  modificado_por: string;

  @ManyToOne(() => Usuario, { nullable: true })
  @JoinColumn({ name: 'modificado_por' })
  modificado_por_usuario: Usuario;
}
