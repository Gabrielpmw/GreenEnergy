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
    public class TelemetriaWorker : BackgroundService
    {
        private readonly IServiceScopeFactory _scopeFactory;
        private readonly ILogger<TelemetriaWorker> _logger;
        private readonly Random _random;

        public TelemetriaWorker(IServiceScopeFactory scopeFactory, ILogger<TelemetriaWorker> logger)
        {
            _scopeFactory = scopeFactory;
            _logger = logger;
            _random = new Random();
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("TelemetriaWorker iniciado. Ciclo de simulação definido para 45 segundos.");

            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    await SimularCicloTelemetriaAsync();
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Erro durante a execução do ciclo de telemetria.");
                }

                // Aguarda 45 segundos antes do próximo ciclo
                await Task.Delay(TimeSpan.FromSeconds(45), stoppingToken);
            }
        }

        private async Task SimularCicloTelemetriaAsync()
        {
            using (var scope = _scopeFactory.CreateScope())
            {
                var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();

                // Buscar sensores em uso e seus respectivos dispositivos ativos e não deletados
                var sensores = await db.Sensores
                    .Include(s => s.Dispositivo)
                    .Where(s => s.Status == SensorStatus.EmUso 
                             && s.DispositivoId != null 
                             && !s.IsDeleted 
                             && s.IsActive 
                             && s.Dispositivo.IsActive 
                             && !s.Dispositivo.IsDeleted)
                    .ToListAsync();

                if (!sensores.Any())
                {
                    _logger.LogInformation("Nenhum sensor ativo para simulação neste ciclo.");
                    return;
                }

                _logger.LogInformation("Processando telemetria para {Count} sensores ativos...", sensores.Count);

                foreach (var sensor in sensores)
                {
                    var dispositivo = sensor.Dispositivo;
                    if (dispositivo == null) continue;

                    // Chance de 1.5% de gerar uma anomalia (Pico de tensão/consumo)
                    bool gerarAnomalia = _random.NextDouble() < 0.015;

                    double volts;
                    double wattsSimulado;

                    // Define a tensão base dependendo do ID do sensor para variar a rede (127V ou 220V)
                    double tensaoBase = (sensor.Id % 2 == 0) ? 127.0 : 220.0;

                    if (gerarAnomalia)
                    {
                        // 3x o consumo nominal do dispositivo
                        wattsSimulado = dispositivo.PotenciaWatts * 3.0;
                        
                        // Sobretensão na rede
                        volts = tensaoBase == 127.0 ? 140.0 : 240.0;

                        _logger.LogWarning("ANOMALIA SIMULADA no dispositivo '{Nome}' (Sensor: {Serie})! Consumo 3x nominal.", 
                            dispositivo.Nome, sensor.NumeroSerie);
                    }
                    else
                    {
                        // Consumo normal com variação de +-15% (multiplicador de 0.85 a 1.15)
                        double multiplicador = 0.85 + (_random.NextDouble() * 0.30);
                        wattsSimulado = dispositivo.PotenciaWatts * multiplicador;

                        // Oscilação normal de tensão (+- 5%)
                        double variacaoVolts = 1.0 - 0.05 + (_random.NextDouble() * 0.10);
                        volts = Math.Round(tensaoBase * variacaoVolts, 1);
                    }

                    // Corrente = Potência (W) / Tensão (V)
                    double corrente = Math.Round(wattsSimulado / volts, 2);

                    // Consumo em kWh gerado no intervalo de 45 segundos:
                    // (Watts * tempo_horas) / 1000 => (Watts * (45 / 3600)) / 1000
                    double consumoKWh = Math.Round((wattsSimulado * (45.0 / 3600.0)) / 1000.0, 5);

                    // Registrar nova leitura
                    var telemetria = new Telemetria
                    {
                        SensorId = sensor.Id,
                        ConsumoKWh = consumoKWh,
                        TensaoV = volts,
                        CorrenteA = corrente,
                        RegistradoEm = DateTime.UtcNow
                    };
                    db.Telemetrias.Add(telemetria);

                    // Atualizar último sinal do sensor
                    sensor.UltimoSinal = DateTime.UtcNow;
                }

                await db.SaveChangesAsync();
                _logger.LogInformation("Ciclo de telemetria salvo com sucesso no banco de dados.");
            }
        }
    }
}
