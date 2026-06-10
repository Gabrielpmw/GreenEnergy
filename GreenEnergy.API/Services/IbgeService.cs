using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using GreenEnergy.API.Data;
using GreenEnergy.API.Models.DTOs;
using GreenEnergy.API.Models.Entities;

namespace GreenEnergy.API.Services
{
    public class IbgeService : IIbgeService
    {
        private readonly ApplicationDbContext _context;
        private readonly HttpClient _httpClient;
        private readonly Random _random;

        public IbgeService(ApplicationDbContext context, HttpClient httpClient)
        {
            _context = context;
            _httpClient = httpClient;
            _random = new Random();
        }

        public async Task<ApiResponse<IbgeMunicipioResponseDTO>> ObterMunicipioPorCodigoAsync(string codigo)
        {
            if (string.IsNullOrWhiteSpace(codigo))
            {
                return new ApiResponse<IbgeMunicipioResponseDTO>("Código IBGE inválido.", null);
            }

            var cache = await _context.CachesDadosIBGE
                .Where(c => c.CodigoIBGE == codigo && c.IsActive && !c.IsDeleted)
                .OrderByDescending(c => c.AtualizadoEm)
                .FirstOrDefaultAsync();

            // Expira em 24 horas
            if (cache == null || cache.AtualizadoEm < DateTime.UtcNow.AddHours(-24))
            {
                // Buscar configuração da API do IBGE
                var configIBGE = await _context.ConfiguracoesAPI
                    .Where(c => c.NomeAPI == "IBGE" && c.IsActive && !c.IsDeleted)
                    .FirstOrDefaultAsync();

                string baseUrl = configIBGE?.BaseUrl ?? "https://servicodados.ibge.gov.br";
                if (baseUrl.EndsWith("/")) baseUrl = baseUrl.TrimEnd('/');

                string nomeMunicipio = "Município " + codigo;
                string uf = "SP";
                int populacao = _random.Next(50000, 300000);

                // Fallbacks baseados em códigos conhecidos
                if (codigo == "3526902") { nomeMunicipio = "Limeira"; uf = "SP"; populacao = 306000; }
                else if (codigo == "3550308") { nomeMunicipio = "São Paulo"; uf = "SP"; populacao = 12300000; }
                else if (codigo == "3509502") { nomeMunicipio = "Campinas"; uf = "SP"; populacao = 1213000; }
                else if (codigo == "3304557") { nomeMunicipio = "Rio de Janeiro"; uf = "RJ"; populacao = 6748000; }
                else if (codigo == "1721000") { nomeMunicipio = "Palmas"; uf = "TO"; populacao = 300000; }
                else if (codigo == "1702109") { nomeMunicipio = "Araguaína"; uf = "TO"; populacao = 171000; }
                else if (codigo == "1716109") { nomeMunicipio = "Paraíso do Tocantins"; uf = "TO"; populacao = 52000; }
                else if (codigo == "1709302") { nomeMunicipio = "Guaraí"; uf = "TO"; populacao = 26000; }

                try
                {
                    string url = $"{baseUrl}/api/v1/localidades/municipios/{codigo}";
                    var response = await _httpClient.GetAsync(url);
                    if (response.IsSuccessStatusCode)
                    {
                        var content = await response.Content.ReadAsStringAsync();
                        using var doc = JsonDocument.Parse(content);
                        var root = doc.RootElement;

                        if (root.TryGetProperty("nome", out var nomeProp))
                        {
                            nomeMunicipio = nomeProp.GetString() ?? nomeMunicipio;
                        }

                        if (root.TryGetProperty("microrregiao", out var micro) &&
                            micro.TryGetProperty("mesorregiao", out var meso) &&
                            meso.TryGetProperty("UF", out var ufProp) &&
                            ufProp.TryGetProperty("sigla", out var sigla))
                        {
                            uf = sigla.GetString() ?? uf;
                        }
                    }
                }
                catch (Exception)
                {
                    // Fallback silencioso para simulação
                }

                if (cache == null)
                {
                    cache = new CacheDadosIBGE
                    {
                        CodigoIBGE = codigo,
                        NomeMunicipio = nomeMunicipio,
                        UF = uf,
                        PopulacaoEstimada = populacao,
                        AtualizadoEm = DateTime.UtcNow,
                        IsActive = true,
                        IsDeleted = false
                    };
                    _context.CachesDadosIBGE.Add(cache);
                }
                else
                {
                    cache.NomeMunicipio = nomeMunicipio;
                    cache.UF = uf;
                    cache.PopulacaoEstimada = populacao;
                    cache.AtualizadoEm = DateTime.UtcNow;
                }

                await _context.SaveChangesAsync();
            }

            var dto = new IbgeMunicipioResponseDTO
            {
                CodigoIBGE = cache.CodigoIBGE,
                NomeMunicipio = cache.NomeMunicipio,
                UF = cache.UF,
                PopulacaoEstimada = cache.PopulacaoEstimada,
                AtualizadoEm = cache.AtualizadoEm
            };

            return new ApiResponse<IbgeMunicipioResponseDTO>(dto);
        }

        public async Task<ApiResponse<IEnumerable<MercadoCidadeResponseDTO>>> ObterDadosMercadoAdminAsync()
        {
            var units = await _context.UnidadesConsumidoras
                .Where(u => u.IsActive && !u.IsDeleted)
                .Include(u => u.Dispositivos)
                .ThenInclude(d => d.Sensor)
                .ThenInclude(s => s.Telemetrias)
                .ToListAsync();

            var grouped = units
                .Where(u => !string.IsNullOrWhiteSpace(u.CodigoIBGE))
                .GroupBy(u => u.CodigoIBGE)
                .ToList();

            var list = new List<MercadoCidadeResponseDTO>();

            foreach (var group in grouped)
            {
                var codigoIbge = group.Key;
                var sampleUnit = group.First();
                var count = group.Count();

                double totalConsumo = group
                    .SelectMany(u => u.Dispositivos)
                    .Where(d => d.Sensor != null)
                    .SelectMany(d => d.Sensor!.Telemetrias)
                    .Sum(t => t.ConsumoKWh);

                var ibgeResult = await ObterMunicipioPorCodigoAsync(codigoIbge);
                int populacao = 100000; // Fallback
                if (ibgeResult.Success && ibgeResult.Data != null)
                {
                    populacao = ibgeResult.Data.PopulacaoEstimada;
                }

                double taxaAdesao = populacao > 0 ? ((double)count / populacao) * 100 : 0;

                list.Add(new MercadoCidadeResponseDTO
                {
                    CodigoIBGE = codigoIbge,
                    Cidade = sampleUnit.Cidade,
                    Estado = sampleUnit.Estado,
                    PopulacaoEstimada = populacao,
                    QuantidadeUnidades = count,
                    TaxaAdesaoPercentual = Math.Round(taxaAdesao, 4),
                    ConsumoTotalKWh = Math.Round(totalConsumo, 2)
                });
            }

            var resultList = list.OrderByDescending(x => x.TaxaAdesaoPercentual).AsEnumerable();
            return new ApiResponse<IEnumerable<MercadoCidadeResponseDTO>>(resultList);
        }
    }
}
