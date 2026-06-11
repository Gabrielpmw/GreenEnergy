using System.ComponentModel.DataAnnotations;

namespace GreenEnergy.API.Models.DTOs
{
    public class CreateCategoriaAparelhoRequestDTO
    {
        [Required(ErrorMessage = "O nome da categoria é obrigatório.")]
        [StringLength(50, MinimumLength = 3, ErrorMessage = "O nome deve ter entre 3 e 50 caracteres.")]
        public string Nome { get; set; } = string.Empty;

        public string? Descricao { get; set; }

        public string? IconeUrl { get; set; }
    }

    public class CategoriaAparelhoResponseDTO
    {
        public int Id { get; set; }
        public string Nome { get; set; } = string.Empty;
        public string? Descricao { get; set; }
        public string? IconeUrl { get; set; }
    }
}
