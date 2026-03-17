import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  UpdateDateColumn,
} from 'typeorm';

@Entity('configuracion_club')
export class ConfiguracionClub {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'time' })
  apertura: string;

  @Column({ type: 'time' })
  cierre: string;

  @Column({ name: 'luz_inicio', type: 'time' })
  luz_inicio: string;

  @Column({ name: 'luz_fin', type: 'time' })
  luz_fin: string;

  @Column({ name: 'duracion_semana_min', default: 60 })
  duracion_semana_min: number;

  @Column({ name: 'duracion_finde_min', default: 90 })
  duracion_finde_min: number;

  @UpdateDateColumn({ name: 'updated_at' })
  updated_at: Date;
}
