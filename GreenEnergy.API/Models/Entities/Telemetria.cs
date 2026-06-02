using System;

namespace GreenEnergy.API.Models.Entities
{
    public class Telemetria : BaseEntity
    {
        public int SensorId { get; set; }
        public double ConsumoKWh { get; set; }
        public double TensaoV { get; set; }
        public double CorrenteA { get; set; }
        public DateTime RegistradoEm { get; set; } = DateTime.UtcNow;

        // Propriedade de Navegação
        public virtual Sensor Sensor { get; set; } = null!;
    }
}
