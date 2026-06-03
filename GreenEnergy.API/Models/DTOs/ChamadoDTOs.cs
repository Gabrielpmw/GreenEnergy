using System;
using System.ComponentModel.DataAnnotations;
using GreenEnergy.API.Models.Entities;

namespace GreenEnergy.API.Models.DTOs
{
    public class CreateChamadoRequestDTO
    {
        [Required(ErrorMessage = "O dispositivo é obrigatório.")]
        public int DispositivoId { get; set; }

        [Required(ErrorMessage = "O tipo de chamado é obrigatório.")]
        public TipoChamado Tipo { get; set; }

        [Required(ErrorMessage = "A descrição é obrigatória.")]
        [StringLength(500, MinimumLength = 5, ErrorMessage = "A descrição deve ter entre 5 e 500 caracteres.")]
        public string Descricao { get; set; } = string.Empty;
    }

    public class UpdateChamadoStatusRequestDTO
    {
        [Required(ErrorMessage = "O status do chamado é obrigatório.")]
        public ChamadoStatus Status { get; set; }
    }

    public class ChamadoResponseDTO
    {
        public int Id { get; set; }
        public int ClienteId { get; set; }
        public string ClienteNome { get; set; } = string.Empty;
        public int? OperadorId { get; set; }
        public string? OperadorNome { get; set; }
        public int DispositivoId { get; set; }
        public string DispositivoNome { get; set; } = string.Empty;
        public string Tipo { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public string Descricao { get; set; } = string.Empty;
        public DateTime CriadoEm { get; set; }
    }
}
