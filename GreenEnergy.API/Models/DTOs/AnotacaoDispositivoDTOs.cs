using System;
using System.ComponentModel.DataAnnotations;

namespace GreenEnergy.API.Models.DTOs
{
    public class CreateAnotacaoDispositivoRequestDTO
    {
        [Required(ErrorMessage = "O conteúdo da anotação é obrigatório.")]
        [StringLength(1000, MinimumLength = 1, ErrorMessage = "A anotação deve ter no máximo 1000 caracteres.")]
        public string Conteudo { get; set; } = string.Empty;
    }

    public class UpdateAnotacaoDispositivoRequestDTO
    {
        [Required(ErrorMessage = "O conteúdo da anotação é obrigatório.")]
        [StringLength(1000, MinimumLength = 1, ErrorMessage = "A anotação deve ter no máximo 1000 caracteres.")]
        public string Conteudo { get; set; } = string.Empty;
    }

    public class AnotacaoDispositivoResponseDTO
    {
        public int Id { get; set; }
        public int DispositivoId { get; set; }
        public int ClienteId { get; set; }
        public string ClienteNome { get; set; } = string.Empty;
        public string Conteudo { get; set; } = string.Empty;
        public DateTime CriadoEm { get; set; }
    }
}
