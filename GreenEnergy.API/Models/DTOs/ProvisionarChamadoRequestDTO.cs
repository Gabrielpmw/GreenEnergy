using System.ComponentModel.DataAnnotations;

namespace GreenEnergy.API.Models.DTOs
{
    public class ProvisionarChamadoRequestDTO
    {
        [Required(ErrorMessage = "O sensor a ser associado é obrigatório.")]
        public int SensorId { get; set; }
    }
}
