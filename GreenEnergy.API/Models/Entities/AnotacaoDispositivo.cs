using System;

namespace GreenEnergy.API.Models.Entities
{
    public class AnotacaoDispositivo : BaseEntity
    {
        public int DispositivoId { get; set; }
        public int ClienteId { get; set; }
        public string Conteudo { get; set; } = string.Empty;
        public DateTime CriadoEm { get; set; } = DateTime.UtcNow;

        // Propriedades de Navegação
        public virtual Dispositivo Dispositivo { get; set; } = null!;
        public virtual Usuario Cliente { get; set; } = null!;
    }
}
