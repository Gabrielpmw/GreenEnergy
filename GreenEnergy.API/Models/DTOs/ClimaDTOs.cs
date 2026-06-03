using System;

namespace GreenEnergy.API.Models.DTOs
{
    public class ClimaResponseDTO
    {
        public string CodigoIBGE { get; set; } = string.Empty;
        public string Cidade { get; set; } = string.Empty;
        public double TempMin { get; set; }
        public double TempMax { get; set; }
        public double UmidadePercent { get; set; }
        public string Descricao { get; set; } = string.Empty;
        public DateTime AtualizadoEm { get; set; }
    }
}
