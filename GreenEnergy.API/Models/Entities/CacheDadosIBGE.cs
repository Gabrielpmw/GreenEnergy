using System;

namespace GreenEnergy.API.Models.Entities
{
    public class CacheDadosIBGE : BaseEntity
    {
        public string CodigoIBGE { get; set; } = string.Empty;
        public string NomeMunicipio { get; set; } = string.Empty;
        public string UF { get; set; } = string.Empty;
        public int PopulacaoEstimada { get; set; }
        public DateTime AtualizadoEm { get; set; } = DateTime.UtcNow;
    }
}
