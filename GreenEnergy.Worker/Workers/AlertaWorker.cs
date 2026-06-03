using System;
using System.Linq;
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
    public class AlertaWorker : BackgroundService
    {
        private readonly IServiceScopeFactory _scopeFactory;
        private readonly ILogger<AlertaWorker> _logger;

        public AlertaWorker(IServiceScopeFactory scopeFactory, ILogger<AlertaWorker> logger)
        {
            _scopeFactory = scopeFactory;
            _logger = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("AlertaWorker iniciado. Ciclo de monitoramento definido para 45 segundos.");

            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    await ProcessarAlertasAsync();
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Erro durante o processamento de alertas.");
                }

                await Task.Delay(TimeSpan.FromSeconds(45), stoppingToken);
            }
        }

        private async Task ProcessarAlertasAsync()
        {
            using (var scope = _scopeFactory.CreateScope())
            {
                var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();

                // Buscar tarifas vigentes para cálculo financeiro
                var tarifaVigente = await db.Tarifas
                    .Where(t => t.IsActive && !t.IsDeleted)
                    .OrderByDescending(t => t.VigenciaInicio)
                    .FirstOrDefaultAsync();

                double valorKWh = tarifaVigente?.ValorKWh ?? 0.65; // Valor de fallback padrão

                // 1. Processar anomalias críticas
                await ProcessarAnomaliasCriticasAsync(db);

                // 2. Processar metas de consumo (kWh e R$)
                await ProcessarMetasConsumoAsync(db, valorKWh);

                // 3. Processar alertas climáticos inteligentes
                await ProcessarAlertasClimaticosAsync(db);

                await db.SaveChangesAsync();
            }
        }

        private async Task ProcessarAnomaliasCriticasAsync(ApplicationDbContext db)
        {
            // Dispositivos ativos com sensores vinculados
            var dispositivos = await db.Dispositivos
                .Include(d => d.UnidadeConsumidora)
                .Include(d => d.Sensor)
                .Where(d => d.Status == DispositivoStatus.Ativo 
                         && d.IsActive 
                         && !d.IsDeleted 
                         && d.Sensor != null 
                         && d.Sensor.Status == SensorStatus.EmUso)
                .ToListAsync();

            var umMinutoAtras = DateTime.UtcNow.AddMinutes(-1);

            foreach (var dispositivo in dispositivos)
            {
                // Buscar a última leitura de telemetria nos últimos 1 minuto
                var ultimaLeitura = await db.Telemetrias
                    .Where(t => t.SensorId == dispositivo.Sensor!.Id && t.RegistradoEm >= umMinutoAtras)
                    .OrderByDescending(t => t.RegistradoEm)
                    .FirstOrDefaultAsync();

                if (ultimaLeitura == null) continue;

                // Valores esperados nominalmente para um ciclo de 45s
                double consumoKWhEsperado = (dispositivo.PotenciaWatts * (45.0 / 3600.0)) / 1000.0;
                double correnteEsperada = dispositivo.PotenciaWatts / ultimaLeitura.TensaoV;

                // Anomalia definida se o consumo ou corrente for 50% superior ao esperado nominalmente
                if (ultimaLeitura.ConsumoKWh > (consumoKWhEsperado * 1.5) || ultimaLeitura.CorrenteA > (correnteEsperada * 1.5))
                {
                    _logger.LogWarning("Anomalia detectada no dispositivo '{Nome}'. Consumo: {Consumo} kWh (Esperado: {Esperado} kWh), Corrente: {Corrente} A (Esperada: {CorrenteEsperada} A).",
                        dispositivo.Nome, ultimaLeitura.ConsumoKWh, consumoKWhEsperado, ultimaLeitura.CorrenteA, correnteEsperada);

                    // Evitar spam de alertas críticos: máximo 1 a cada 10 minutos por dispositivo
                    var dezMinutosAtras = DateTime.UtcNow.AddMinutes(-10);
                    bool jaAlertado = await db.Alertas.AnyAsync(a => 
                        a.DispositivoId == dispositivo.Id 
                        && a.Tipo == TipoAlerta.Critico 
                        && a.GeradoEm >= dezMinutosAtras
                        && a.Mensagem.Contains("Anomalia detectada"));

                    if (!jaAlertado)
                    {
                        var alertaCritico = new Alerta
                        {
                            UsuarioId = dispositivo.UnidadeConsumidora.UsuarioId,
                            DispositivoId = dispositivo.Id,
                            Mensagem = "Anomalia detectada: Pico de tensão/corrente. Risco de falha no equipamento.",
                            Tipo = TipoAlerta.Critico,
                            Lido = false,
                            GeradoEm = DateTime.UtcNow
                        };
                        db.Alertas.Add(alertaCritico);
                        _logger.LogInformation("Alerta Crítico gerado para o dispositivo '{Nome}'.", dispositivo.Nome);
                    }
                }
            }
        }

        private async Task ProcessarMetasConsumoAsync(ApplicationDbContext db, double valorKWh)
        {
            var inicioMes = new DateTime(DateTime.UtcNow.Year, DateTime.UtcNow.Month, 1, 0, 0, 0, DateTimeKind.Utc);

            // Carregar metas aprovadas
            var metasAprovadas = await db.Metas
                .Include(m => m.Dispositivo)
                .ThenInclude(d => d.UnidadeConsumidora)
                .Where(m => m.Status == MetaStatus.Aprovada && m.IsActive && !m.IsDeleted)
                .ToListAsync();

            foreach (var meta in metasAprovadas)
            {
                var dispositivo = meta.Dispositivo;
                if (dispositivo == null || dispositivo.Sensor == null) continue;

                // Soma do consumo acumulado da telemetria do dispositivo no mês corrente
                double consumoMensalKWh = await db.Telemetrias
                    .Where(t => t.SensorId == dispositivo.Sensor.Id && t.RegistradoEm >= inicioMes)
                    .SumAsync(t => t.ConsumoKWh);

                bool limiteUltrapassado = false;

                if (meta.TipoMeta == TipoMeta.KWh)
                {
                    limiteUltrapassado = consumoMensalKWh > meta.ValorLimite;
                }
                else if (meta.TipoMeta == TipoMeta.Financeira)
                {
                    double custoMensal = consumoMensalKWh * valorKWh;
                    limiteUltrapassado = custoMensal > meta.ValorLimite;
                }

                if (limiteUltrapassado)
                {
                    // Evitar spam de alertas normais de meta: 1 por mês civil
                    bool jaAlertadoMeta = await db.Alertas.AnyAsync(a =>
                        a.DispositivoId == dispositivo.Id
                        && a.Tipo == TipoAlerta.Alerta
                        && a.GeradoEm >= inicioMes
                        && a.Mensagem.Contains("meta de consumo"));

                    if (!jaAlertadoMeta)
                    {
                        var alertaMeta = new Alerta
                        {
                            UsuarioId = dispositivo.UnidadeConsumidora.UsuarioId,
                            DispositivoId = dispositivo.Id,
                            Mensagem = $"Alerta: A meta de consumo de {meta.ValorLimite} {(meta.TipoMeta == TipoMeta.KWh ? "kWh" : "R$")} para o dispositivo '{dispositivo.Nome}' foi ultrapassada neste mês.",
                            Tipo = TipoAlerta.Alerta,
                            Lido = false,
                            GeradoEm = DateTime.UtcNow
                        };
                        db.Alertas.Add(alertaMeta);
                        _logger.LogInformation("Alerta de meta ultrapassada gerado para o dispositivo '{Nome}'.", dispositivo.Nome);
                    }
                }
            }
        }

        private async Task ProcessarAlertasClimaticosAsync(ApplicationDbContext db)
        {
            // Obter dispositivos de climatização (ID 1)
            var climatizadores = await db.Dispositivos
                .Include(d => d.UnidadeConsumidora)
                .Where(d => d.CategoriaId == 1 && d.Status == DispositivoStatus.Ativo && d.IsActive && !d.IsDeleted)
                .ToListAsync();

            var hojeInicio = DateTime.UtcNow.Date;

            foreach (var disp in climatizadores)
            {
                string cep = disp.UnidadeConsumidora.CEP;

                // Buscar cache climático regional correspondente ao CEP/cidade
                var clima = await db.CachesClima
                    .Where(c => c.Cidade == disp.UnidadeConsumidora.Cidade)
                    .OrderByDescending(c => c.AtualizadoEm)
                    .FirstOrDefaultAsync();

                if (clima != null && clima.TempMax > 30.0)
                {
                    // Evitar spam de aviso climático: 1 por dia
                    bool jaAlertadoClima = await db.Alertas.AnyAsync(a =>
                        a.DispositivoId == disp.Id
                        && a.Tipo == TipoAlerta.Informativo
                        && a.GeradoEm >= hojeInicio
                        && a.Mensagem.Contains("Temperatura elevada"));

                    if (!jaAlertadoClima)
                    {
                        var alertaClima = new Alerta
                        {
                            UsuarioId = disp.UnidadeConsumidora.UsuarioId,
                            DispositivoId = disp.Id,
                            Mensagem = $"Aviso: Temperatura elevada de {clima.TempMax}°C registrada em {clima.Cidade}. Evite o uso prolongado do Ar Condicionado para economizar energia.",
                            Tipo = TipoAlerta.Informativo,
                            Lido = false,
                            GeradoEm = DateTime.UtcNow
                        };
                        db.Alertas.Add(alertaClima);
                        _logger.LogInformation("Alerta Informativo de Clima gerado para o dispositivo '{Nome}' em {Cidade}.", disp.Nome, clima.Cidade);
                    }
                }
            }
        }
    }
}
