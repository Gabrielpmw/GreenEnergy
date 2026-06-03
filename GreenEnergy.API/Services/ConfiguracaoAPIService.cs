using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using GreenEnergy.API.Models.DTOs;
using GreenEnergy.API.Models.Entities;
using GreenEnergy.API.Repositories;

namespace GreenEnergy.API.Services
{
    public class ConfiguracaoAPIService : IConfiguracaoAPIService
    {
        private readonly IConfiguracaoAPIRepository _configRepository;

        public ConfiguracaoAPIService(IConfiguracaoAPIRepository configRepository)
        {
            _configRepository = configRepository;
        }

        public async Task<ApiResponse<ConfiguracaoAPIResponseDTO>> GetByIdAsync(int id)
        {
            var config = await _configRepository.GetByIdAsync(id);
            if (config == null)
            {
                return new ApiResponse<ConfiguracaoAPIResponseDTO>("Configuração de API não encontrada.");
            }
            return new ApiResponse<ConfiguracaoAPIResponseDTO>(MapToResponse(config));
        }

        public async Task<ApiResponse<ConfiguracaoAPIResponseDTO>> GetByNameAsync(string apiName)
        {
            var config = await _configRepository.GetByNameAsync(apiName);
            if (config == null)
            {
                return new ApiResponse<ConfiguracaoAPIResponseDTO>("Configuração de API não encontrada.");
            }
            return new ApiResponse<ConfiguracaoAPIResponseDTO>(MapToResponse(config));
        }

        public async Task<ApiResponse<IEnumerable<ConfiguracaoAPIResponseDTO>>> ListAllAsync()
        {
            var configs = await _configRepository.ListAllAsync();
            return new ApiResponse<IEnumerable<ConfiguracaoAPIResponseDTO>>(configs.Select(MapToResponse));
        }

        public async Task<ApiResponse<ConfiguracaoAPIResponseDTO>> CreateConfigAsync(CreateConfiguracaoAPIRequestDTO dto)
        {
            var existing = await _configRepository.GetByNameAsync(dto.NomeAPI);
            if (existing != null)
            {
                return new ApiResponse<ConfiguracaoAPIResponseDTO>($"Já existe uma configuração cadastrada para a API '{dto.NomeAPI}'.");
            }

            var config = new ConfiguracaoAPI
            {
                NomeAPI = dto.NomeAPI,
                ChaveAcesso = dto.ChaveAcesso,
                BaseUrl = dto.BaseUrl,
                AtualizadoEm = DateTime.UtcNow,
                IsActive = true
            };

            await _configRepository.AddAsync(config);
            return new ApiResponse<ConfiguracaoAPIResponseDTO>(MapToResponse(config), "Configuração de API salva com sucesso!");
        }

        public async Task<ApiResponse<ConfiguracaoAPIResponseDTO>> UpdateConfigAsync(int id, UpdateConfiguracaoAPIRequestDTO dto)
        {
            var config = await _configRepository.GetByIdAsync(id);
            if (config == null)
            {
                return new ApiResponse<ConfiguracaoAPIResponseDTO>("Configuração de API não encontrada.");
            }

            config.ChaveAcesso = dto.ChaveAcesso;
            config.BaseUrl = dto.BaseUrl;
            config.AtualizadoEm = DateTime.UtcNow;

            await _configRepository.UpdateAsync(config);
            return new ApiResponse<ConfiguracaoAPIResponseDTO>(MapToResponse(config), "Configuração de API atualizada com sucesso!");
        }

        public async Task<ApiResponse<bool>> DeleteConfigAsync(int id)
        {
            var config = await _configRepository.GetByIdAsync(id);
            if (config == null)
            {
                return new ApiResponse<bool>(false, "Configuração de API não encontrada.");
            }

            await _configRepository.DeleteAsync(config);
            return new ApiResponse<bool>(true, "Configuração de API removida com sucesso!");
        }

        private ConfiguracaoAPIResponseDTO MapToResponse(ConfiguracaoAPI c)
        {
            return new ConfiguracaoAPIResponseDTO
            {
                Id = c.Id,
                NomeAPI = c.NomeAPI,
                ChaveAcesso = c.ChaveAcesso,
                BaseUrl = c.BaseUrl,
                AtualizadoEm = c.AtualizadoEm
            };
        }
    }
}
