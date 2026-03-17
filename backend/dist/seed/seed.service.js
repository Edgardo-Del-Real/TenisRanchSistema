"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var SeedService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SeedService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const bcrypt = require("bcryptjs");
const usuario_entity_1 = require("../entities/usuario.entity");
const cancha_entity_1 = require("../entities/cancha.entity");
const configuracion_club_entity_1 = require("../entities/configuracion-club.entity");
const tarifa_entity_1 = require("../entities/tarifa.entity");
const rol_enum_1 = require("../common/enums/rol.enum");
const estado_cancha_enum_1 = require("../common/enums/estado-cancha.enum");
const tipo_tarifa_enum_1 = require("../common/enums/tipo-tarifa.enum");
let SeedService = SeedService_1 = class SeedService {
    constructor(usuarioRepository, canchaRepository, configuracionRepository, tarifaRepository) {
        this.usuarioRepository = usuarioRepository;
        this.canchaRepository = canchaRepository;
        this.configuracionRepository = configuracionRepository;
        this.tarifaRepository = tarifaRepository;
        this.logger = new common_1.Logger(SeedService_1.name);
    }
    async seedDefaultAdmin() {
        try {
            const existingAdmin = await this.usuarioRepository.findOne({
                where: { email: 'adriana@gmail.com' },
            });
            if (existingAdmin) {
                this.logger.log('Usuario administrador ya existe: adriana@gmail.com');
            }
            else {
                const passwordHash = await bcrypt.hash('admin123', 10);
                const adminUser = this.usuarioRepository.create({
                    nombre: 'Adriana',
                    apellido: 'Administrador',
                    email: 'adriana@gmail.com',
                    password_hash: passwordHash,
                    telefono: '1234567890',
                    rol: rol_enum_1.Rol.ADMINISTRADOR,
                    activo: true,
                });
                await this.usuarioRepository.save(adminUser);
                this.logger.log('✅ Usuario administrador creado exitosamente:');
                this.logger.log('   Email: adriana@gmail.com');
                this.logger.log('   Contraseña: admin123');
                this.logger.log('   ⚠️  IMPORTANTE: Cambia la contraseña después del primer login');
            }
            await this.seedCanchas();
            await this.seedConfiguracion();
            await this.seedTarifas();
        }
        catch (error) {
            this.logger.error('Error en el seeding:', error);
        }
    }
    async seedCanchas() {
        try {
            const existingCanchas = await this.canchaRepository.count();
            if (existingCanchas > 0) {
                this.logger.log('Las canchas ya existen en la base de datos');
                return;
            }
            const canchas = [];
            for (let i = 1; i <= 4; i++) {
                const cancha = this.canchaRepository.create({
                    numero: i,
                    estado: estado_cancha_enum_1.EstadoCancha.DISPONIBLE,
                    razon_estado: null,
                });
                canchas.push(cancha);
            }
            await this.canchaRepository.save(canchas);
            this.logger.log('✅ Canchas creadas exitosamente (1-4)');
        }
        catch (error) {
            this.logger.error('Error al crear canchas:', error);
        }
    }
    async seedConfiguracion() {
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
        }
        catch (error) {
            this.logger.error('Error al crear configuración:', error);
        }
    }
    async seedTarifas() {
        try {
            const existingTarifas = await this.tarifaRepository.count();
            if (existingTarifas > 0) {
                this.logger.log('Las tarifas ya existen en la base de datos');
                return;
            }
            const now = new Date();
            const tarifas = [
                {
                    tipo: tipo_tarifa_enum_1.TipoTarifa.CUOTA,
                    valor: 5000,
                    vigente_desde: now,
                },
                {
                    tipo: tipo_tarifa_enum_1.TipoTarifa.TURNO_NO_SOCIO,
                    valor: 3000,
                    vigente_desde: now,
                },
                {
                    tipo: tipo_tarifa_enum_1.TipoTarifa.LUZ,
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
        }
        catch (error) {
            this.logger.error('Error al crear tarifas:', error);
        }
    }
};
exports.SeedService = SeedService;
exports.SeedService = SeedService = SeedService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(usuario_entity_1.Usuario)),
    __param(1, (0, typeorm_1.InjectRepository)(cancha_entity_1.Cancha)),
    __param(2, (0, typeorm_1.InjectRepository)(configuracion_club_entity_1.ConfiguracionClub)),
    __param(3, (0, typeorm_1.InjectRepository)(tarifa_entity_1.Tarifa)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], SeedService);
//# sourceMappingURL=seed.service.js.map