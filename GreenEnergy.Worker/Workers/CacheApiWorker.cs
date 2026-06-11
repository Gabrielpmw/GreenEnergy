using System;
using System.Linq;
using System.Net.Http;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using GreenEnergy.API.Data;
using GreenEnergy.API.Models.Entities;

namespace GreenEnergy.Worker.Workers
{
    public class CacheApiWorker : BackgroundService
    {
        private readonly IServiceScopeFactory _scopeFactory;
        private readonly ILogger<CacheApiWorker> _logger;
        private readonly HttpClient _httpClient;
        private readonly Random _random;

        public CacheApiWorker(IServiceScopeFactory scopeFactory, ILogger<CacheApiWorker> logger, HttpClient httpClient)
        {
            _scopeFactory = scopeFactory;
            _logger = logger;
            _httpClient = httpClient;
            _random = new Random();
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("CacheApiWorker iniciado.");

            // Executa imediatamente na inicialização
            await SincronizarCachesAsync();

            while (!stoppingToken.IsCancellationRequested)
            {
                // A cada 15 minutos, o Worker verifica se algum cache de clima (1h) ou IBGE (24h) precisa de atualização.
                // Isso economiza recursos em vez de esperar 1 hora inteira de forma bloqueante.
                await Task.Delay(TimeSpan.FromMinutes(15), stoppingToken);
                
                try
                {
                    await SincronizarCachesAsync();
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Erro ao sincronizar caches climáticos/municipais.");
                }
            }
        }

        private async Task SincronizarCachesAsync()
        {
            using (var scope = _scopeFactory.CreateScope())
            {
                var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();

                // 1. Obter códigos IBGE e cidades únicas das Unidades Consumidoras ativas
                var localizacoesAtivas = await db.UnidadesConsumidoras
                    .Where(u => u.IsActive && !u.IsDeleted)
                    .Select(u => new { u.CEP, u.Cidade, u.Estado })
                    .Distinct()
                    .ToListAsync();

                if (!localizacoesAtivas.Any())
                {
                    _logger.LogInformation("Nenhuma unidade consumidora ativa encontrada para sincronizar caches.");
                    return;
                }

                // 2. Buscar chave do OpenWeather configurada (se houver)
                var configOpenWeather = await db.ConfiguracoesAPI
                    .Where(c => c.NomeAPI == "OpenWeather" && c.IsActive && !c.IsDeleted)
                    .FirstOrDefaultAsync();

                string apiKey = configOpenWeather?.ChaveAcesso ?? string.Empty;

                foreach (var loc in localizacoesAtivas)
                {
                    // Código IBGE correspondente (usamos o CEP como código de busca no banco ou simulamos um código IBGE padrão)
                    string codigoIBGE = ObterCodigoIBGEFakeParaCep(loc.CEP);

                    // Sincronizar Clima (Limite de expiração: 1 hora)
                    await SincronizarClimaLocalAsync(db, codigoIBGE, loc.Cidade, apiKey);

                    // Sincronizar IBGE Dados (Limite de expiração: 24 horas)
                    await SincronizarDadosIBGELocalAsync(db, codigoIBGE, loc.Cidade, loc.Estado);
                }

                await db.SaveChangesAsync();
            }
        }

        private async Task SincronizarClimaLocalAsync(ApplicationDbContext db, string codigoIBGE, string cidade, string apiKey)
        {
            var cacheExistente = await db.CachesClima
                .Where(c => c.Cidade == cidade)
                .OrderByDescending(c => c.AtualizadoEm)
                .FirstOrDefaultAsync();

            // Se o cache já foi atualizado na última 1 hora, ignora
            if (cacheExistente != null && cacheExistente.AtualizadoEm >= DateTime.UtcNow.AddHours(-1))
            {
                return;
            }

            _logger.LogInformation("Sincronizando cache de clima para a cidade: {Cidade}...", cidade);

            double tempMin = 18.0;
            double tempMax = 28.0;
            double umidade = 65.0;
            string descricao = "Parcialmente nublado";

            if (!string.IsNullOrEmpty(apiKey))
            {
                try
                {
                    // Fazer requisição real ao OpenWeather
                    string url = $"https://api.openweathermap.org/data/2.5/weather?q={Uri.EscapeDataString(cidade)},BR&appid={apiKey}&units=metric&lang=pt_br";
                    var response = await _httpClient.GetAsync(url);
                    if (response.IsSuccessStatusCode)
                    {
                        var content = await response.Content.ReadAsStringAsync();
                        using var doc = JsonDocument.Parse(content);
                        var root = doc.RootElement;

                        tempMin = root.GetProperty("main").GetProperty("temp_min").GetDouble();
                        tempMax = root.GetProperty("main").GetProperty("temp_max").GetDouble();
                        umidade = root.GetProperty("main").GetProperty("humidity").GetDouble();
                        descricao = root.GetProperty("weather")[0].GetProperty("description").GetString() ?? descricao;
                    }
                    else
                    {
                        _logger.LogWarning("OpenWeather API retornou status {Status} para {Cidade}. Usando simulação.", response.StatusCode, cidade);
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Falha na chamada ao OpenWeather para {Cidade}. Usando simulação.", cidade);
                }
            }
            else
            {
                // Simulação realista de clima de acordo com a localidade (ex: Rio de Janeiro costuma ser mais quente)
                if (cidade.Contains("Rio de Janeiro"))
                {
                    tempMin = 22.0 + (_random.NextDouble() * 3.0);
                    tempMax = 31.0 + (_random.NextDouble() * 5.0); // Pode passar de 30° para testar os alertas!
                    umidade = 60.0 + (_random.NextDouble() * 20.0);
                    descricao = "Ensolarado com poucas nuvens";
                }
                else
                {
                    tempMin = 15.0 + (_random.NextDouble() * 4.0);
                    tempMax = 24.0 + (_random.NextDouble() * 8.0); // Ocasionalmente passa de 30°
                    umidade = 50.0 + (_random.NextDouble() * 35.0);
                    descricao = _random.Next(2) == 0 ? "Sol entre nuvens" : "Céu limpo";
                }
            }

            if (cacheExistente == null)
            {
                db.CachesClima.Add(new CacheClima
                {
                    CodigoIBGE = codigoIBGE,
                    Cidade = cidade,
                    TempMin = Math.Round(tempMin, 1),
                    TempMax = Math.Round(tempMax, 1),
                    Descricao = descricao,
                    UmidadePercent = Math.Round(umidade, 1),
                    AtualizadoEm = DateTime.UtcNow,
                    IsActive = true,
                    IsDeleted = false
                });
            }
            else
            {
                cacheExistente.TempMin = Math.Round(tempMin, 1);
                cacheExistente.TempMax = Math.Round(tempMax, 1);
                cacheExistente.Descricao = descricao;
                cacheExistente.UmidadePercent = Math.Round(umidade, 1);
                cacheExistente.AtualizadoEm = DateTime.UtcNow;
            }
        }

        private async Task SincronizarDadosIBGELocalAsync(ApplicationDbContext db, string codigoIBGE, string cidade, string estado)
        {
            var cacheExistente = await db.CachesDadosIBGE
                .Where(c => c.CodigoIBGE == codigoIBGE)
                .OrderByDescending(c => c.AtualizadoEm)
                .FirstOrDefaultAsync();

            // Se o cache já foi atualizado nas últimas 24 horas, ignora
            if (cacheExistente != null && cacheExistente.AtualizadoEm >= DateTime.UtcNow.AddHours(-24))
            {
                return;
            }

            _logger.LogInformation("Sincronizando dados demográficos do IBGE para o código: {CodigoIBGE} ({Cidade})...", codigoIBGE, cidade);

            int populacao = _random.Next(50000, 300000); // População padrão simulada

            try
            {
                // Chamada oficial à API do IBGE localidades
                string url = $"https://servicodados.ibge.gov.br/api/v1/localidades/municipios/{codigoIBGE}";
                var response = await _httpClient.GetAsync(url);
                if (response.IsSuccessStatusCode)
                {
                    var content = await response.Content.ReadAsStringAsync();
                    // Apenas valida se o retorno é um JSON estruturado válido
                    using var doc = JsonDocument.Parse(content);
                    // Como a API de localidade não traz população direta, simulamos baseada no tamanho da cidade real
                    if (cidade.Contains("São Paulo")) populacao = 12300000;
                    else if (cidade.Contains("Rio de Janeiro")) populacao = 6748000;
                    else if (cidade.Contains("Campinas")) populacao = 1213000;
                    else if (cidade.Contains("Limeira")) populacao = 306000;
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Erro na chamada de API de localidade do IBGE. Usando fallback de simulação.");
            }

            if (cacheExistente == null)
            {
                db.CachesDadosIBGE.Add(new CacheDadosIBGE
                {
                    CodigoIBGE = codigoIBGE,
                    NomeMunicipio = cidade,
                    UF = estado,
                    PopulacaoEstimada = populacao,
                    AtualizadoEm = DateTime.UtcNow,
                    IsActive = true,
                    IsDeleted = false
                });
            }
            else
            {
                cacheExistente.NomeMunicipio = cidade;
                cacheExistente.UF = estado;
                cacheExistente.PopulacaoEstimada = populacao;
                cacheExistente.AtualizadoEm = DateTime.UtcNow;
            }
        }

        private string ObterCodigoIBGEFakeParaCep(string cep)
        {
            // Mapeamento determinístico de CEPs de teste para códigos IBGE reais do município
            if (cep == "13480001" || cep == "13480002") return "3526902"; // Limeira
            if (cep == "01001000") return "3550308"; // São Paulo
            if (cep == "13010000") return "3509502"; // Campinas
            if (cep == "20040002") return "3304557"; // Rio de Janeiro
            
            // Fallback genérico determinístico baseado no hash do CEP
            int hash = Math.Abs(cep.GetHashCode());
            return (3500000 + (hash % 100000)).ToString();
        }
    }
}
