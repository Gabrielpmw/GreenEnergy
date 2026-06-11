using System;

namespace GreenEnergy.API.Models.Entities
{
    public class Alerta : BaseEntity
    {
        public int UsuarioId { get; set; }
        public int? DispositivoId { get; set; }
        public string Mensagem { get; set; } = string.Empty;
        public TipoAlerta Tipo { get; set; }
        public bool Lido { get; set; } = false;
        public DateTime GeradoEm { get; set; } = DateTime.UtcNow;

        // Propriedades de Navegação
        public virtual Usuario Usuario { get; set; } = null!;
        public virtual Dispositivo? Dispositivo { get; set; }
    }
}
