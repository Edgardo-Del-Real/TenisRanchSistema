import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PagoTurno, PagoLuz, Turno } from '../entities';
import { CreatePagoTurnoDto } from './dto/create-pago-turno.dto';
import { CreatePagoLuzDto } from './dto/create-pago-luz.dto';
import { Rol } from '../common/enums/rol.enum';

@Injectable()
export class PagosService {
  constructor(
    @InjectRepository(PagoTurno)
    private pagoTurnoRepository: Repository<PagoTurno>,
    @InjectRepository(PagoLuz)
    private pagoLuzRepository: Repository<PagoLuz>,
    @InjectRepository(Turno)
    private turnoRepository: Repository<Turno>,
  ) {}

  async registrarPagoTurno(
    createPagoTurnoDto: CreatePagoTurnoDto,
    userId: string,
  ): Promise<PagoTurno> {
    const { turno_id, monto, metodo_pago } = createPagoTurnoDto;

    // Verificar que el turno existe
    const turno = await this.turnoRepository.findOne({
      where: { id: turno_id },
      relations: ['usuario'],
    });

    if (!turno) {
      throw new NotFoundException('Turno no encontrado');
    }

    // Verificar que el turno pertenece a un No_Socio
    if (turno.usuario.rol !== Rol.NO_SOCIO) {
      throw new BadRequestException('Solo se pueden registrar pagos para turnos de No_Socios');
    }

    // Verificar que no existe ya un pago para este turno
    const pagoExistente = await this.pagoTurnoRepository.findOne({
      where: { turno_id },
    });

    if (pagoExistente) {
      throw new BadRequestException('Ya existe un pago registrado para este turno');
    }

    const pagoTurno = this.pagoTurnoRepository.create({
      turno_id,
      monto,
      metodo_pago,
      fecha_pago: new Date(),
      registrado_por: userId,
    });

    return await this.pagoTurnoRepository.save(pagoTurno);
  }

  async registrarPagoLuz(
    createPagoLuzDto: CreatePagoLuzDto,
    userId: string,
  ): Promise<PagoLuz> {
    const { monto, descripcion } = createPagoLuzDto;

    const pagoLuz = this.pagoLuzRepository.create({
      monto,
      descripcion,
      fecha_pago: new Date(),
      registrado_por: userId,
    });

    return await this.pagoLuzRepository.save(pagoLuz);
  }

  async obtenerPagosLuz(): Promise<PagoLuz[]> {
    return await this.pagoLuzRepository.find({
      relations: ['registrado_por_usuario'],
      order: { fecha_pago: 'DESC' },
    });
  }
}