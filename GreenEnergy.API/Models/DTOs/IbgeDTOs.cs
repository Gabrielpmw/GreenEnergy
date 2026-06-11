using System;

namespace GreenEnergy.API.Models.DTOs
{
    public class IbgeMunicipioResponseDTO
    {
        public string CodigoIBGE { get; set; } = string.Empty;
        public string NomeMunicipio { get; set; } = string.Empty;
        public string UF { get; set; } = string.Empty;
        public int PopulacaoEstimada { get; set; }
        public DateTime AtualizadoEm { get; set; }
    }

    public class MercadoCidadeResponseDTO
    {
        public string CodigoIBGE { get; set; } = null!;
        public string Cidade { get; set; } = null!;
        public string Estado { get; set; } = null!;
        public int PopulacaoEstimada { get; set; }
        public int QuantidadeUnidades { get; set; }
        public double TaxaAdesaoPercentual { get; set; }
        public double ConsumoTotalKWh { get; set; }
    }
}
