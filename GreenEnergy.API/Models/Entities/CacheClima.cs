using System;

namespace GreenEnergy.API.Models.Entities
{
    public class CacheClima : BaseEntity
    {
        public string CodigoIBGE { get; set; } = string.Empty;
        public string Cidade { get; set; } = string.Empty;
        public double TempMin { get; set; }
        public double TempMax { get; set; }
        public string Descricao { get; set; } = string.Empty;
        public double UmidadePercent { get; set; }
        public DateTime AtualizadoEm { get; set; } = DateTime.UtcNow;
    }
}
