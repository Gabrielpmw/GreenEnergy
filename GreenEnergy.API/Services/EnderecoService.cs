using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using GreenEnergy.API.Data;
using GreenEnergy.API.Models.DTOs;
using GreenEnergy.API.Models.Entities;
using GreenEnergy.API.Integrations;

namespace GreenEnergy.API.Services
{
    public class EnderecoService : IEnderecoService
    {
        private readonly ApplicationDbContext _context;
        private readonly IViaCepClient _viaCepClient;
        private readonly IIbgeService _ibgeService;

        public EnderecoService(ApplicationDbContext context, IViaCepClient viaCepClient, IIbgeService ibgeService)
        {
            _context = context;
            _viaCepClient = viaCepClient;
            _ibgeService = ibgeService;
        }

        public async Task<ApiResponse<ViaCepDTO>> ConsultarCepAsync(string cep)
        {
            try
            {
                var result = await _viaCepClient.ConsultarCepAsync(cep);
                if (result == null)
                {
                    return new ApiResponse<ViaCepDTO>("CEP não localizado ou inválido.", null);
                }
                return new ApiResponse<ViaCepDTO>(result);
            }
            catch (Exception ex)
            {
                return new ApiResponse<ViaCepDTO>($"Erro ao consultar CEP: {ex.Message}", null);
            }
        }

        public async Task<ApiResponse<IbgeMunicipioResponseDTO>> ConsultarIbgeCacheAsync(string codigoIBGE)
        {
            return await _ibgeService.ObterMunicipioPorCodigoAsync(codigoIBGE);
        }

        public async Task<ApiResponse<IEnumerable<ComparativoEficienciaDTO>>> ObterComparativoPorCepAsync(string cep, int clienteId)
        {
            if (string.IsNullOrWhiteSpace(cep))
            {
                return new ApiResponse<IEnumerable<ComparativoEficienciaDTO>>("CEP inválido.", null);
            }

            var clientUnits = await _context.UnidadesConsumidoras
                .Where(u => u.UsuarioId == clienteId && u.CEP == cep && u.IsActive && !u.IsDeleted)
                .Include(u => u.Dispositivos)
                .ThenInclude(d => d.Telemetrias)
                .ToListAsync();

            if (!clientUnits.Any())
            {
                return new ApiResponse<IEnumerable<ComparativoEficienciaDTO>>(new List<ComparativoEficienciaDTO>(), "Nenhuma unidade consumidora cadastrada para o cliente neste CEP.");
            }

            var comparativos = new List<ComparativoEficienciaDTO>();

            // Agrupa as unidades do cliente neste CEP por tipo de imóvel
            var tiposImovel = clientUnits.Select(u => u.TipoImovel).Distinct();

            foreach (var tipo in tiposImovel)
            {
                var clientUnitsOfType = clientUnits.Where(u => u.TipoImovel == tipo).ToList();
                double totalConsumoCliente = clientUnitsOfType
                    .SelectMany(u => u.Dispositivos)
                    .SelectMany(d => d.Telemetrias)
                    .Sum(t => t.ConsumoKWh);

                double clientAvg = clientUnitsOfType.Count > 0 ? totalConsumoCliente / clientUnitsOfType.Count : 0;

                // Média Regional (todas as unidades do mesmo tipo neste CEP)
                var regionalUnits = await _context.UnidadesConsumidoras
                    .Where(u => u.CEP == cep && u.TipoImovel == tipo && u.IsActive && !u.IsDeleted)
                    .Include(u => u.Dispositivos)
                    .ThenInclude(d => d.Telemetrias)
                    .ToListAsync();

                double totalConsumoRegional = regionalUnits
                    .SelectMany(u => u.Dispositivos)
                    .SelectMany(d => d.Telemetrias)
                    .Sum(t => t.ConsumoKWh);

                double regionalAvg = regionalUnits.Count > 0 ? totalConsumoRegional / regionalUnits.Count : 0;

                double diferencaPercentual = 0;
                string mensagem;

                if (regionalAvg > 0)
                {
                    diferencaPercentual = ((clientAvg - regionalAvg) / regionalAvg) * 100;
                    if (diferencaPercentual < 0)
                    {
                        mensagem = $"Sua unidade consome {Math.Abs(diferencaPercentual):0.0}% a menos que a média local.";
                    }
                    else if (diferencaPercentual > 0)
                    {
                        mensagem = $"Sua unidade consome {diferencaPercentual:0.0}% a mais que a média local.";
                    }
                    else
                    {
                        mensagem = "Sua unidade consome exatamente a média local.";
                    }
                }
                else
                {
                    mensagem = "Não há dados regionais suficientes para comparação.";
                }

                comparativos.Add(new ComparativoEficienciaDTO
                {
                    CEP = cep,
                    Cidade = clientUnitsOfType.First().Cidade,
                    TipoImovel = tipo.ToString(),
                    ConsumoClienteKWh = Math.Round(clientAvg, 2),
                    ConsumoMedioRegionalKWh = Math.Round(regionalAvg, 2),
                    DiferencaPercentual = Math.Round(diferencaPercentual, 1),
                    Mensagem = mensagem
                });
            }

            return new ApiResponse<IEnumerable<ComparativoEficienciaDTO>>(comparativos);
        }

        public async Task<ApiResponse<IEnumerable<ComparativoEficienciaDTO>>> ObterComparativoPorCidadeAsync(string cidade, int clienteId)
        {
            if (string.IsNullOrWhiteSpace(cidade))
            {
                return new ApiResponse<IEnumerable<ComparativoEficienciaDTO>>("Cidade inválida.", null);
            }

            var clientUnits = await _context.UnidadesConsumidoras
                .Where(u => u.UsuarioId == clienteId && u.Cidade.ToLower() == cidade.ToLower() && u.IsActive && !u.IsDeleted)
                .Include(u => u.Dispositivos)
                .ThenInclude(d => d.Telemetrias)
                .ToListAsync();

            if (!clientUnits.Any())
            {
                return new ApiResponse<IEnumerable<ComparativoEficienciaDTO>>(new List<ComparativoEficienciaDTO>(), "Nenhuma unidade consumidora cadastrada para o cliente nesta cidade.");
            }

            var comparativos = new List<ComparativoEficienciaDTO>();
            var tiposImovel = clientUnits.Select(u => u.TipoImovel).Distinct();

            foreach (var tipo in tiposImovel)
            {
                var clientUnitsOfType = clientUnits.Where(u => u.TipoImovel == tipo).ToList();
                double totalConsumoCliente = clientUnitsOfType
                    .SelectMany(u => u.Dispositivos)
                    .SelectMany(d => d.Telemetrias)
                    .Sum(t => t.ConsumoKWh);

                double clientAvg = clientUnitsOfType.Count > 0 ? totalConsumoCliente / clientUnitsOfType.Count : 0;

                // Média Regional (todas as unidades do mesmo tipo nesta cidade)
                var regionalUnits = await _context.UnidadesConsumidoras
                    .Where(u => u.Cidade.ToLower() == cidade.ToLower() && u.TipoImovel == tipo && u.IsActive && !u.IsDeleted)
                    .Include(u => u.Dispositivos)
                    .ThenInclude(d => d.Telemetrias)
                    .ToListAsync();

                double totalConsumoRegional = regionalUnits
                    .SelectMany(u => u.Dispositivos)
                    .SelectMany(d => d.Telemetrias)
                    .Sum(t => t.ConsumoKWh);

                double regionalAvg = regionalUnits.Count > 0 ? totalConsumoRegional / regionalUnits.Count : 0;

                double diferencaPercentual = 0;
                string mensagem;

                if (regionalAvg > 0)
                {
                    diferencaPercentual = ((clientAvg - regionalAvg) / regionalAvg) * 100;
                    if (diferencaPercentual < 0)
                    {
                        mensagem = $"Sua unidade consome {Math.Abs(diferencaPercentual):0.0}% a menos que a média regional.";
                    }
                    else if (diferencaPercentual > 0)
                    {
                        mensagem = $"Sua unidade consome {diferencaPercentual:0.0}% a mais que a média regional.";
                    }
                    else
                    {
                        mensagem = "Sua unidade consome exatamente a média regional.";
                    }
                }
                else
                {
                    mensagem = "Não há dados regionais suficientes para comparação.";
                }

                comparativos.Add(new ComparativoEficienciaDTO
                {
                    CEP = clientUnitsOfType.First().CEP,
                    Cidade = clientUnitsOfType.First().Cidade,
                    TipoImovel = tipo.ToString(),
                    ConsumoClienteKWh = Math.Round(clientAvg, 2),
                    ConsumoMedioRegionalKWh = Math.Round(regionalAvg, 2),
                    DiferencaPercentual = Math.Round(diferencaPercentual, 1),
                    Mensagem = mensagem
                });
            }

            return new ApiResponse<IEnumerable<ComparativoEficienciaDTO>>(comparativos);
        }
    }
}
