namespace GreenEnergy.API.Models.DTOs
{
    public class ComparativoEficienciaDTO
    {
        public string CEP { get; set; } = string.Empty;
        public string Cidade { get; set; } = string.Empty;
        public string TipoImovel { get; set; } = string.Empty;
        public double ConsumoClienteKWh { get; set; }
        public double ConsumoMedioRegionalKWh { get; set; }
        public double DiferencaPercentual { get; set; }
        public string Mensagem { get; set; } = string.Empty;
    }
}
