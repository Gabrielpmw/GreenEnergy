using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using GreenEnergy.API.Models.DTOs;
using GreenEnergy.API.Models.Entities;
using GreenEnergy.API.Repositories;

namespace GreenEnergy.API.Services
{
    public class TarifaService : ITarifaService
    {
        private readonly ITarifaRepository _tarifaRepository;

        public TarifaService(ITarifaRepository tarifaRepository)
        {
            _tarifaRepository = tarifaRepository;
        }

        public async Task<ApiResponse<TarifaResponseDTO>> GetByIdAsync(int id)
        {
            var tarifa = await _tarifaRepository.GetByIdAsync(id);
            if (tarifa == null)
            {
                return new ApiResponse<TarifaResponseDTO>("Tarifa não encontrada.");
            }
            return new ApiResponse<TarifaResponseDTO>(MapToResponse(tarifa));
        }

        public async Task<ApiResponse<IEnumerable<TarifaResponseDTO>>> ListAllAsync()
        {
            var tarifas = await _tarifaRepository.ListAllAsync();
            return new ApiResponse<IEnumerable<TarifaResponseDTO>>(tarifas.Select(MapToResponse));
        }

        public async Task<ApiResponse<TarifaResponseDTO>> GetLatestActiveAsync()
        {
            var tarifa = await _tarifaRepository.GetLatestActiveAsync();
            if (tarifa == null)
            {
                return new ApiResponse<TarifaResponseDTO>("Nenhuma tarifa ativa cadastrada.");
            }
            return new ApiResponse<TarifaResponseDTO>(MapToResponse(tarifa));
        }

        public async Task<ApiResponse<TarifaResponseDTO>> CreateTarifaAsync(CreateTarifaRequestDTO dto)
        {
            if (dto.ValorKWh <= 0)
            {
                return new ApiResponse<TarifaResponseDTO>("O valor do kWh deve ser maior que zero.");
            }

            var tarifa = new Tarifa
            {
                Bandeira = dto.Bandeira,
                ValorKWh = dto.ValorKWh,
                VigenciaInicio = DateTime.UtcNow,
                IsActive = true
            };

            await _tarifaRepository.AddAsync(tarifa);
            return new ApiResponse<TarifaResponseDTO>(MapToResponse(tarifa), "Tarifa cadastrada com sucesso!");
        }

        public async Task<ApiResponse<TarifaResponseDTO>> ToggleTarifaStateAsync(int id, bool active)
        {
            var tarifa = await _tarifaRepository.GetByIdAsync(id);
            if (tarifa == null)
            {
                return new ApiResponse<TarifaResponseDTO>("Tarifa não encontrada.");
            }

            tarifa.IsActive = active;
            await _tarifaRepository.UpdateAsync(tarifa);

            string msg = active ? "Tarifa ativada com sucesso." : "Tarifa desativada com sucesso.";
            return new ApiResponse<TarifaResponseDTO>(MapToResponse(tarifa), msg);
        }

        private TarifaResponseDTO MapToResponse(Tarifa t)
        {
            return new TarifaResponseDTO
            {
                Id = t.Id,
                Bandeira = t.Bandeira.ToString(),
                ValorKWh = t.ValorKWh,
                VigenciaInicio = t.VigenciaInicio,
                IsActive = t.IsActive
            };
        }
    }
}
