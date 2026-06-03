using System;
using System.ComponentModel.DataAnnotations;
using GreenEnergy.API.Models.Entities;

namespace GreenEnergy.API.Models.DTOs
{
    public class CreateTarifaRequestDTO
    {
        [Required(ErrorMessage = "A bandeira tarifária é obrigatória.")]
        public BandeiraTarifa Bandeira { get; set; }

        [Required(ErrorMessage = "O valor por kWh é obrigatório.")]
        [Range(0.01, double.MaxValue, ErrorMessage = "O valor por kWh deve ser maior que zero.")]
        public double ValorKWh { get; set; }
    }

    public class TarifaResponseDTO
    {
        public int Id { get; set; }
        public string Bandeira { get; set; } = string.Empty;
        public double ValorKWh { get; set; }
        public DateTime VigenciaInicio { get; set; }
        public bool IsActive { get; set; }
    }
}
