namespace GreenEnergy.API.Models.Entities
{
    public class Endereco : BaseEntity
    {
        public int UnidadeConsumidoraId { get; set; }
        public string CEP { get; set; } = string.Empty;
        public string Logradouro { get; set; } = string.Empty;
        public string Numero { get; set; } = string.Empty;
        public string? Complemento { get; set; }
        public string Bairro { get; set; } = string.Empty;
        public string Cidade { get; set; } = string.Empty;
        public string UF { get; set; } = string.Empty;

        // Propriedade de Navegação
        public virtual UnidadeConsumidora UnidadeConsumidora { get; set; } = null!;
    }
}
