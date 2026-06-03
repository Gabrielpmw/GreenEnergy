using System;
using System.ComponentModel.DataAnnotations;
using GreenEnergy.API.Models.Entities;

namespace GreenEnergy.API.Models.DTOs
{
    public class CreateDispositivoRequestDTO
    {
        [Required(ErrorMessage = "A Unidade Consumidora é obrigatória.")]
        public int UnidadeConsumidoraId { get; set; }

        [Required(ErrorMessage = "A categoria é obrigatória.")]
        public int CategoriaId { get; set; }

        [Required(ErrorMessage = "O nome é obrigatório.")]
        [StringLength(100, MinimumLength = 3, ErrorMessage = "O nome deve ter entre 3 e 100 caracteres.")]
        public string Nome { get; set; } = string.Empty;

        [Required(ErrorMessage = "O tipo de aparelho é obrigatório.")]
        public string TipoAparelho { get; set; } = string.Empty;

        public string? Descricao { get; set; }

        [Required(ErrorMessage = "A potência em Watts é obrigatória.")]
        [Range(0.1, 100000.0, ErrorMessage = "A potência deve ser maior que 0.")]
        public double PotenciaWatts { get; set; }
    }

    public class UpdateDispositivoRequestDTO
    {
        [Required(ErrorMessage = "O nome é obrigatório.")]
        [StringLength(100, MinimumLength = 3, ErrorMessage = "O nome deve ter entre 3 e 100 caracteres.")]
        public string Nome { get; set; } = string.Empty;

        [Required(ErrorMessage = "O tipo de aparelho é obrigatório.")]
        public string TipoAparelho { get; set; } = string.Empty;

        public string? Descricao { get; set; }

        [Required(ErrorMessage = "A potência em Watts é obrigatória.")]
        [Range(0.1, 100000.0, ErrorMessage = "A potência deve ser maior que 0.")]
        public double PotenciaWatts { get; set; }
    }

    public class DispositivoResponseDTO
    {
        public int Id { get; set; }
        public int UnidadeConsumidoraId { get; set; }
        public int CategoriaId { get; set; }
        public string CategoriaNome { get; set; } = string.Empty;
        public string Nome { get; set; } = string.Empty;
        public string TipoAparelho { get; set; } = string.Empty;
        public string? Descricao { get; set; }
        public double PotenciaWatts { get; set; }
        public string Status { get; set; } = string.Empty;
        public DateTime CriadoEm { get; set; }
        public SensorResponseDTO? Sensor { get; set; }
    }
}
