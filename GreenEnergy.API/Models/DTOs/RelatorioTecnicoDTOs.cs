using System;
using System.ComponentModel.DataAnnotations;
using GreenEnergy.API.Models.Entities;

namespace GreenEnergy.API.Models.DTOs
{
    public class CreateRelatorioTecnicoRequestDTO
    {
        public int? ChamadoId { get; set; }

        public int? DispositivoId { get; set; }

        [Required(ErrorMessage = "O conteúdo do relatório é obrigatório.")]
        [StringLength(2000, MinimumLength = 10, ErrorMessage = "O conteúdo deve ter entre 10 e 2000 caracteres.")]
        public string Conteudo { get; set; } = string.Empty;

        [Required(ErrorMessage = "O tipo de ocorrência é obrigatório.")]
        public TipoOcorrencia TipoOcorrencia { get; set; }
    }

    public class RelatorioTecnicoResponseDTO
    {
        public int Id { get; set; }
        public int? ChamadoId { get; set; }
        public int? DispositivoId { get; set; }
        public string? DispositivoNome { get; set; }
        public int OperadorId { get; set; }
        public string OperadorNome { get; set; } = string.Empty;
        public string Conteudo { get; set; } = string.Empty;
        public string TipoOcorrencia { get; set; } = string.Empty;
        public DateTime CriadoEm { get; set; }
    }
}
