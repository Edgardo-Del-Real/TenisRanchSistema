import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException } from '@nestjs/common';
import { ConfiguracionService } from '../configuracion.service';
import { ConfiguracionClub } from '../../entities/configuracion-club.entity';

describe('ConfiguracionService', () => {
  let service: ConfiguracionService;
  let repository: Repository<ConfiguracionClub>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ConfiguracionService,
        {
          provide: getRepositoryToken(ConfiguracionClub),
          useValue: {
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<ConfiguracionService>(ConfiguracionService);
    repository = module.get<Repository<ConfiguracionClub>>(
      getRepositoryToken(ConfiguracionClub),
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getConfiguracion', () => {
    it('should return configuration when it exists', async () => {
      const mockConfig = {
        id: '1',
        apertura: '08:00:00',
        cierre: '22:00:00',
        luz_inicio: '18:30:00',
        luz_fin: '19:00:00',
        duracion_semana_min: 60,
        duracion_finde_min: 90,
        updated_at: new Date(),
      };

      jest.spyOn(repository, 'findOne').mockResolvedValue(mockConfig as ConfiguracionClub);

      const result = await service.getConfiguracion();

      expect(result).toEqual(mockConfig);
      expect(repository.findOne).toHaveBeenCalledWith({
        where: {},
        order: { updated_at: 'DESC' },
      });
    });

    it('should throw NotFoundException when configuration does not exist', async () => {
      jest.spyOn(repository, 'findOne').mockResolvedValue(null);

      await expect(service.getConfiguracion()).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateConfiguracion', () => {
    it('should update existing configuration', async () => {
      const existingConfig = {
        id: '1',
        apertura: '08:00:00',
        cierre: '22:00:00',
        luz_inicio: '18:30:00',
        luz_fin: '19:00:00',
        duracion_semana_min: 60,
        duracion_finde_min: 90,
        updated_at: new Date(),
      };

      const updateDto = {
        apertura: '07:00:00',
        cierre: '23:00:00',
        luz_inicio: '19:00:00',
        luz_fin: '20:00:00',
        duracion_semana_min: 90,
        duracion_finde_min: 120,
      };

      const updatedConfig = {
        ...existingConfig,
        ...updateDto,
      };

      jest.spyOn(repository, 'findOne').mockResolvedValue(existingConfig as ConfiguracionClub);
      jest.spyOn(repository, 'save').mockResolvedValue(updatedConfig as ConfiguracionClub);

      const result = await service.updateConfiguracion(updateDto);

      expect(result.apertura).toBe('07:00:00');
      expect(result.cierre).toBe('23:00:00');
      expect(result.duracion_semana_min).toBe(90);
      expect(repository.save).toHaveBeenCalled();
    });

    it('should create configuration if it does not exist', async () => {
      const createDto = {
        apertura: '08:00:00',
        cierre: '22:00:00',
        luz_inicio: '18:30:00',
        luz_fin: '19:00:00',
        duracion_semana_min: 60,
        duracion_finde_min: 90,
      };

      const newConfig = {
        id: '1',
        ...createDto,
        updated_at: new Date(),
      };

      jest.spyOn(repository, 'findOne').mockResolvedValue(null);
      jest.spyOn(repository, 'create').mockReturnValue(newConfig as ConfiguracionClub);
      jest.spyOn(repository, 'save').mockResolvedValue(newConfig as ConfiguracionClub);

      const result = await service.updateConfiguracion(createDto);

      expect(repository.create).toHaveBeenCalledWith(createDto);
      expect(repository.save).toHaveBeenCalled();
      expect(result).toEqual(newConfig);
    });
  });
});
