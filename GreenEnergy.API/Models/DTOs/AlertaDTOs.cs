using System;

namespace GreenEnergy.API.Models.DTOs
{
    public class AlertaResponseDTO
    {
        public int Id { get; set; }
        public int UsuarioId { get; set; }
        public int? DispositivoId { get; set; }
        public string? DispositivoNome { get; set; }
        public string Mensagem { get; set; } = string.Empty;
        public string Tipo { get; set; } = string.Empty;
        public bool Lido { get; set; }
        public DateTime GeradoEm { get; set; }
    }
}
