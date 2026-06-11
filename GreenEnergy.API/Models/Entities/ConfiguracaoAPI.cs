using System;

namespace GreenEnergy.API.Models.Entities
{
    public class ConfiguracaoAPI : BaseEntity
    {
        public string NomeAPI { get; set; } = string.Empty;
        public string ChaveAcesso { get; set; } = string.Empty;
        public string BaseUrl { get; set; } = string.Empty;
        public DateTime AtualizadoEm { get; set; } = DateTime.UtcNow;
    }
}
