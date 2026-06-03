using System;
using System.ComponentModel.DataAnnotations;

namespace GreenEnergy.API.Models.DTOs
{
    public class CreateSensorRequestDTO
    {
        [Required(ErrorMessage = "O modelo do sensor é obrigatório.")]
        public string ModeloSensor { get; set; } = string.Empty;

        [Required(ErrorMessage = "O número de série é obrigatório.")]
        public string NumeroSerie { get; set; } = string.Empty;
    }

    public class UpdateSensorRequestDTO
    {
        [Required(ErrorMessage = "O modelo do sensor é obrigatório.")]
        public string ModeloSensor { get; set; } = string.Empty;

        [Required(ErrorMessage = "O número de série é obrigatório.")]
        public string NumeroSerie { get; set; } = string.Empty;
    }

    public class SensorResponseDTO
    {
        public int Id { get; set; }
        public int? DispositivoId { get; set; }
        public string? DispositivoNome { get; set; }
        public string ModeloSensor { get; set; } = string.Empty;
        public string NumeroSerie { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty; // Disponivel, EmUso, Manutencao, Defeito
        public DateTime? UltimoSinal { get; set; }
    }
}
