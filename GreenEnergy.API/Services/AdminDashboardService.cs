using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using GreenEnergy.API.Data;
using GreenEnergy.API.Models.DTOs;
using GreenEnergy.API.Models.Entities;

namespace GreenEnergy.API.Services
{
    public class AdminDashboardService : IAdminDashboardService
    {
        private readonly ApplicationDbContext _context;

        public AdminDashboardService(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<ApiResponse<AdminDashboardResponseDTO>> GetDashboardMetricsAsync()
        {
            // 1. Volume total de energia na rede
            double volumeTotal = await _context.Telemetrias
                .Where(t => !t.IsDeleted)
                .SumAsync(t => t.ConsumoKWh);

            // 2. Saúde dos sensores
            int sensoresAtivos = await _context.Sensores
                .Where(s => s.Status == SensorStatus.EmUso && s.IsActive && !s.IsDeleted)
                .CountAsync();

            int sensoresInativos = await _context.Sensores
                .Where(s => s.Status != SensorStatus.EmUso && s.IsActive && !s.IsDeleted)
                .CountAsync();

            // 3. Fila de chamados pendentes
            int chamadosPendentes = await _context.Chamados
                .Where(c => (c.Status == ChamadoStatus.Pendente || c.Status == ChamadoStatus.EmAnalise) && !c.IsDeleted)
                .CountAsync();

            // 4. Status das APIs Externas
            var apisStatus = new Dictionary<string, string>();
            
            var weatherCfg = await _context.ConfiguracoesAPI.FirstOrDefaultAsync(c => c.NomeAPI == "OpenWeather" && !c.IsDeleted);
            apisStatus["OpenWeather"] = weatherCfg != null && !string.IsNullOrEmpty(weatherCfg.ChaveAcesso) ? "Configurada" : "Não Configurada";

            apisStatus["IBGE"] = "Configurada"; // IBGE é pública e não exige chaves
            apisStatus["ViaCEP"] = "Configurada"; // ViaCEP é pública e não exige chaves

            // 5. Saúde do Worker Service (Heartbeat)
            string saudeWorker = "Inativo";
            var heartbeatCfg = await _context.ConfiguracoesAPI.FirstOrDefaultAsync(c => c.NomeAPI == "Worker_Heartbeat" && !c.IsDeleted);
            if (heartbeatCfg != null && DateTime.TryParse(heartbeatCfg.ChaveAcesso, out var lastHeartbeat))
            {
                var timeDiff = DateTime.UtcNow - lastHeartbeat.ToUniversalTime();
                if (timeDiff <= TimeSpan.FromMinutes(2))
                {
                    saudeWorker = "Saudável";
                }
            }

            var dto = new AdminDashboardResponseDTO
            {
                VolumeTotalEnergiaKWh = Math.Round(volumeTotal, 2),
                SensoresAtivosCount = sensoresAtivos,
                SensoresInativosCount = sensoresInativos,
                ChamadosPendentesCount = chamadosPendentes,
                StatusApisExternas = apisStatus,
                SaudeWorkerService = saudeWorker
            };

            return new ApiResponse<AdminDashboardResponseDTO>(dto);
        }
    }
}
