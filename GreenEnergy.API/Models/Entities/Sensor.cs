using System;
using System.Collections.Generic;

namespace GreenEnergy.API.Models.Entities
{
    public class Sensor : BaseEntity
    {
        public int? DispositivoId { get; set; }
        public string ModeloSensor { get; set; } = string.Empty;
        public string NumeroSerie { get; set; } = string.Empty;
        public SensorStatus Status { get; set; } = SensorStatus.Disponivel;
        public DateTime? UltimoSinal { get; set; }
        public string? Observacao { get; set; }


        // Propriedades de Navegação
        public virtual Dispositivo Dispositivo { get; set; } = null!;
        public virtual ICollection<Telemetria> Telemetrias { get; set; } = new List<Telemetria>();
    }
}
