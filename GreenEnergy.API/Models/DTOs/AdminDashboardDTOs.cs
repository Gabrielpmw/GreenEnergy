using System.Collections.Generic;

namespace GreenEnergy.API.Models.DTOs
{
    public class AdminDashboardResponseDTO
    {
        public double VolumeTotalEnergiaKWh { get; set; }
        public Dictionary<string, string> StatusApisExternas { get; set; } = new Dictionary<string, string>();
        public string SaudeWorkerService { get; set; } = string.Empty;
        public int SensoresAtivosCount { get; set; }
        public int SensoresInativosCount { get; set; }
        public int ChamadosPendentesCount { get; set; }
    }
}
