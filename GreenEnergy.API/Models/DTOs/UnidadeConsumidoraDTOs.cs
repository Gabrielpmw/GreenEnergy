using System.ComponentModel.DataAnnotations;
using GreenEnergy.API.Models.Entities;

namespace GreenEnergy.API.Models.DTOs
{
    public class CreateUnidadeConsumidoraRequestDTO
    {
        [Required(ErrorMessage = "O CEP é obrigatório.")]
        [RegularExpression(@"^\d{5}-\d{3}$|^\d{8}$", ErrorMessage = "CEP deve estar no formato 12345-678 ou 12345678.")]
        public string CEP { get; set; } = string.Empty;

        [Required(ErrorMessage = "O tipo do imóvel é obrigatório.")]
        public TipoImovel TipoImovel { get; set; }

        [Required(ErrorMessage = "O número é obrigatório.")]
        public string Numero { get; set; } = string.Empty;

        public string? Complemento { get; set; }

        // Fallback Manual fields if ViaCEP is offline
        public string? Logradouro { get; set; }
        public string? Bairro { get; set; }
        public string? Cidade { get; set; }
        public string? UF { get; set; }
    }

    public class UnidadeConsumidoraResponseDTO
    {
        public int Id { get; set; }
        public int UsuarioId { get; set; }
        public string TipoImovel { get; set; } = string.Empty;
        public string CEP { get; set; } = string.Empty;
        public string CodigoIBGE { get; set; } = string.Empty;
        public string Cidade { get; set; } = string.Empty;
        public string Estado { get; set; } = string.Empty;
        public EnderecoResponseDTO Endereco { get; set; } = null!;
    }

    public class EnderecoResponseDTO
    {
        public string CEP { get; set; } = string.Empty;
        public string Logradouro { get; set; } = string.Empty;
        public string Numero { get; set; } = string.Empty;
        public string? Complemento { get; set; }
        public string Bairro { get; set; } = string.Empty;
        public string Cidade { get; set; } = string.Empty;
        public string UF { get; set; } = string.Empty;
    }
}
