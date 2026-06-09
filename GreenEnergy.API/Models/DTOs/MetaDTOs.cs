using System;
using System.ComponentModel.DataAnnotations;
using GreenEnergy.API.Models.Entities;

namespace GreenEnergy.API.Models.DTOs
{
    public class CreateMetaRequestDTO
    {
        [Required(ErrorMessage = "O dispositivo é obrigatório.")]
        public int DispositivoId { get; set; }

        [Required(ErrorMessage = "O tipo de meta é obrigatório.")]
        public TipoMeta TipoMeta { get; set; }

        [Required(ErrorMessage = "O valor limite é obrigatório.")]
        [Range(0.01, double.MaxValue, ErrorMessage = "O valor limite deve ser maior que zero.")]
        public double ValorLimite { get; set; }

        [Required(ErrorMessage = "A justificativa é obrigatória.")]
        [StringLength(250, MinimumLength = 5, ErrorMessage = "A justificativa deve ter entre 5 e 250 caracteres.")]
        public string Justificativa { get; set; } = string.Empty;

        public DateTime DataInicio { get; set; } = DateTime.UtcNow;
        public DateTime? DataFim { get; set; }
        public bool DesligarAoEstourar { get; set; } = false;
    }

    public class UpdateMetaRequestDTO
    {
        [Required(ErrorMessage = "O tipo de meta é obrigatório.")]
        public TipoMeta TipoMeta { get; set; }

        [Required(ErrorMessage = "O valor limite é obrigatório.")]
        [Range(0.01, double.MaxValue, ErrorMessage = "O valor limite deve ser maior que zero.")]
        public double ValorLimite { get; set; }

        [Required(ErrorMessage = "A justificativa é obrigatória.")]
        [StringLength(250, MinimumLength = 5, ErrorMessage = "A justificativa deve ter entre 5 e 250 caracteres.")]
        public string Justificativa { get; set; } = string.Empty;

        public DateTime DataInicio { get; set; }
        public DateTime? DataFim { get; set; }
        public bool DesligarAoEstourar { get; set; }
    }

    public class AvaliarMetaRequestDTO
    {
        [Required(ErrorMessage = "O status da avaliação é obrigatório.")]
        public MetaStatus Status { get; set; }

        [Required(ErrorMessage = "As observações da avaliação são obrigatórias.")]
        [StringLength(250, MinimumLength = 5, ErrorMessage = "A observação deve ter entre 5 e 250 caracteres.")]
        public string AvaliacaoObs { get; set; } = string.Empty;
    }

    public class MetaResponseDTO
    {
        public int Id { get; set; }
        public int DispositivoId { get; set; }
        public string DispositivoNome { get; set; } = string.Empty;
        public int? OperadorId { get; set; }
        public string? OperadorNome { get; set; }
        public string TipoMeta { get; set; } = string.Empty;
        public double ValorLimite { get; set; }
        public string Justificativa { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public string? AvaliacaoObs { get; set; }
        public DateTime DataInicio { get; set; }
        public DateTime? DataFim { get; set; }
        public bool DesligarAoEstourar { get; set; }
        public bool DispositivoDesligadoPorMeta { get; set; }
    }
}
