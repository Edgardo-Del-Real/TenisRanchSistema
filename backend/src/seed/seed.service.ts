import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Usuario } from '../entities/usuario.entity';
import { Cancha } from '../entities/cancha.entity';
import { ConfiguracionClub } from '../entities/configuracion-club.entity';
import { Tarifa } from '../entities/tarifa.entity';
import { Rol } from '../common/enums/rol.enum';
import { EstadoCancha } from '../common/enums/estado-cancha.enum';
import { TipoTarifa } from '../common/enums/tipo-tarifa.enum';

@Injectable()
export class SeedService {
  private readonly logger = new Logger(SeedService.name);

  constructor(
    @InjectRepository(Usuario)
    private readonly usuarioRepository: Repository<Usuario>,
    @InjectRepository(Cancha)
    private readonly canchaRepository: Repository<Cancha>,
    @InjectRepository(ConfiguracionClub)
    private readonly configuracionRepository: Repository<ConfiguracionClub>,
    @InjectRepository(Tarifa)
    private readonly tarifaRepository: Repository<Tarifa>,
  ) {}

  async seedDefaultAdmin(): Promise<void> {
    try {
      // Verificar si ya existe un administrador
      const existingAdmin = await this.usuarioRepository.findOne({
        where: { email: 'adriana@gmail.com' },
      });

      if (existingAdmin) {
        this.logger.log('Usuario administrador ya existe: adriana@gmail.com');
      } else {
        // Crear el usuario administrador por defecto
        const passwordHash = await bcrypt.hash('admin123', 10);
        
        const adminUser = this.usuarioRepository.create({
          nombre: 'Adriana',
          apellido: 'Administrador',
          email: 'adriana@gmail.com',
          password_hash: passwordHash,
          telefono: '1234567890',
          rol: Rol.ADMINISTRADOR,
          activo: true,
        });

        await this.usuarioRepository.save(adminUser);
        
        this.logger.log('✅ Usuario administrador creado exitosamente:');
        this.logger.log('   Email: adriana@gmail.com');
        this.logger.log('   Contraseña: admin123');
        this.logger.log('   ⚠️  IMPORTANTE: Cambia la contraseña después del primer login');
      }

      // Seed canchas
      await this.seedCanchas();
      
      // Seed configuración
      await this.seedConfiguracion();
      
      // Seed tarifas
      await this.seedTarifas();
      
    } catch (error) {
      this.logger.error('Error en el seeding:', error);
    }
  }

  private async seedCanchas(): Promise<void> {
    try {
      const existingCanchas = await this.canchaRepository.count();
      
      if (existingCanchas > 0) {
        this.logger.log('Las canchas ya existen en la base de datos');
        return;
      }

      // Crear 4 canchas por defecto
      const canchas = [];
      for (let i = 1; i <= 4; i++) {
        const cancha = this.canchaRepository.create({
          numero: i,
          estado: EstadoCancha.DISPONIBLE,
          razon_estado: null,
        });
        canchas.push(cancha);
      }

      await this.canchaRepository.save(canchas);
      this.logger.log('✅ Canchas creadas exitosamente (1-4)');
      
    } catch (error) {
      this.logger.error('Error al crear canchas:', error);
    }
  }

  private async seedConfiguracion(): Promise<void> {
    try {
      const existingConfig = await this.configuracionRepository.count();
      
      if (existingConfig > 0) {
        this.logger.log('La configuración ya existe en la base de datos');
        return;
      }

      const configuracion = this.configuracionRepository.create({
        apertura: '08:00:00',
        cierre: '22:00:00',
        luz_inicio: '18:00:00',
        luz_fin: '22:00:00',
        duracion_semana_min: 60,
        duracion_finde_min: 90,
      });

      await this.configuracionRepository.save(configuracion);
      this.logger.log('✅ Configuración del club creada exitosamente');
      
    } catch (error) {
      this.logger.error('Error al crear configuración:', error);
    }
  }

  private async seedTarifas(): Promise<void> {
    try {
      const existingTarifas = await this.tarifaRepository.count();
      
      if (existingTarifas > 0) {
        this.logger.log('Las tarifas ya existen en la base de datos');
        return;
      }

      const now = new Date();
      const tarifas = [
        {
          tipo: TipoTarifa.CUOTA,
          valor: 5000,
          vigente_desde: now,
        },
        {
          tipo: TipoTarifa.TURNO_NO_SOCIO,
          valor: 3000,
          vigente_desde: now,
        },
        {
          tipo: TipoTarifa.LUZ,
          valor: 500,
          vigente_desde: now,
        },
      ];

      for (const tarifaData of tarifas) {
        const tarifa = this.tarifaRepository.create(tarifaData);
        await this.tarifaRepository.save(tarifa);
      }

      this.logger.log('✅ Tarifas creadas exitosamente:');
      this.logger.log('   - Cuota mensual: $5,000');
      this.logger.log('   - Turno no socio: $3,000');
      this.logger.log('   - Cargo de luz: $500');
      
    } catch (error) {
      this.logger.error('Error al crear tarifas:', error);
    }
  }
}