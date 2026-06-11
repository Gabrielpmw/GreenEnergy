using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using GreenEnergy.API.Models.DTOs;
using GreenEnergy.API.Models.Entities;
using GreenEnergy.API.Repositories;

namespace GreenEnergy.API.Services
{
    public class SensorService : ISensorService
    {
        private readonly ISensorRepository _sensorRepository;

        public SensorService(ISensorRepository sensorRepository)
        {
            _sensorRepository = sensorRepository;
        }

        public async Task<ApiResponse<SensorResponseDTO>> CreateSensorAsync(CreateSensorRequestDTO dto)
        {
            var todos = await _sensorRepository.ListAllAsync();
            if (todos.Any(s => s.NumeroSerie.Equals(dto.NumeroSerie, StringComparison.OrdinalIgnoreCase)))
            {
                return new ApiResponse<SensorResponseDTO>("Já existe um sensor cadastrado com este número de série.");
            }

            var sensor = new Sensor
            {
                ModeloSensor = dto.ModeloSensor,
                NumeroSerie = dto.NumeroSerie,
                Status = SensorStatus.Disponivel,
                Observacao = dto.Observacao
            };

            await _sensorRepository.AddAsync(sensor);

            var responseDto = MapToResponse(sensor);
            return new ApiResponse<SensorResponseDTO>(responseDto, "Sensor cadastrado com sucesso!");
        }

        public async Task<ApiResponse<SensorResponseDTO>> GetByIdAsync(int id)
        {
            var sensor = await _sensorRepository.GetByIdAsync(id);
            if (sensor == null)
            {
                return new ApiResponse<SensorResponseDTO>("Sensor não encontrado.");
            }

            var dto = MapToResponse(sensor);
            return new ApiResponse<SensorResponseDTO>(dto);
        }

        public async Task<ApiResponse<IEnumerable<SensorResponseDTO>>> ListAllAsync()
        {
            var sensores = await _sensorRepository.ListAllAsync();
            return new ApiResponse<IEnumerable<SensorResponseDTO>>(sensores.Select(MapToResponse));
        }

        public async Task<ApiResponse<IEnumerable<SensorResponseDTO>>> ListAvailableAsync()
        {
            var disponiveis = await _sensorRepository.ListAvailableAsync();
            return new ApiResponse<IEnumerable<SensorResponseDTO>>(disponiveis.Select(MapToResponse));
        }

        public async Task<ApiResponse<SensorResponseDTO>> UpdateAsync(int id, UpdateSensorRequestDTO dto)
        {
            var sensor = await _sensorRepository.GetByIdAsync(id);
            if (sensor == null)
            {
                return new ApiResponse<SensorResponseDTO>("Sensor não encontrado.");
            }

            if (!sensor.NumeroSerie.Equals(dto.NumeroSerie, StringComparison.OrdinalIgnoreCase))
            {
                var todos = await _sensorRepository.ListAllAsync();
                if (todos.Any(s => s.NumeroSerie.Equals(dto.NumeroSerie, StringComparison.OrdinalIgnoreCase)))
                {
                    return new ApiResponse<SensorResponseDTO>("Já existe outro sensor cadastrado com este número de série.");
                }
            }

            sensor.ModeloSensor = dto.ModeloSensor;
            sensor.NumeroSerie = dto.NumeroSerie;
            sensor.Observacao = dto.Observacao;

            await _sensorRepository.UpdateAsync(sensor);

            var responseDto = MapToResponse(sensor);
            return new ApiResponse<SensorResponseDTO>(responseDto, "Sensor atualizado com sucesso!");
        }

        public async Task<ApiResponse<SensorResponseDTO>> UpdateStatusAsync(int id, SensorStatus status)
        {
            var sensor = await _sensorRepository.GetByIdAsync(id);
            if (sensor == null)
            {
                return new ApiResponse<SensorResponseDTO>("Sensor não encontrado.");
            }

            if (status == SensorStatus.Disponivel && sensor.DispositivoId.HasValue)
            {
                sensor.DispositivoId = null;
            }

            sensor.Status = status;
            await _sensorRepository.UpdateAsync(sensor);

            var responseDto = MapToResponse(sensor);
            return new ApiResponse<SensorResponseDTO>(responseDto, $"Status do sensor atualizado para {status} com sucesso!");
        }

        public async Task<ApiResponse<bool>> DesativarAsync(int id)
        {
            var sensor = await _sensorRepository.GetByIdAsync(id);
            if (sensor == null)
            {
                return new ApiResponse<bool>("Sensor não encontrado.");
            }

            sensor.IsActive = false;
            sensor.IsDeleted = true;
            sensor.DispositivoId = null;

            await _sensorRepository.UpdateAsync(sensor);
            return new ApiResponse<bool>(true, "Sensor desativado/removido do estoque com sucesso.");
        }

        private SensorResponseDTO MapToResponse(Sensor s)
        {
            var dispositivo = s.Dispositivo;
            var unidade = dispositivo?.UnidadeConsumidora;
            var usuario = unidade?.Usuario;
            var perfil = usuario?.Perfil;

            return new SensorResponseDTO
            {
                Id = s.Id,
                DispositivoId = s.DispositivoId,
                DispositivoNome = dispositivo != null ? dispositivo.Nome : null,
                ModeloSensor = s.ModeloSensor,
                NumeroSerie = s.NumeroSerie,
                Status = s.Status.ToString(),
                UltimoSinal = s.UltimoSinal,
                Observacao = s.Observacao,
                ClienteNome = usuario?.Nome,
                ClienteCpf = perfil?.Documento
            };
        }
    }
}
