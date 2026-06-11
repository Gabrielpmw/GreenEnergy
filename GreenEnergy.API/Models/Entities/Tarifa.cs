using System;

namespace GreenEnergy.API.Models.Entities
{
    public class Tarifa : BaseEntity
    {
        public BandeiraTarifa Bandeira { get; set; }
        public double ValorKWh { get; set; }
        public DateTime VigenciaInicio { get; set; }

        public Tarifa()
        {
            VigenciaInicio = DateTime.UtcNow;
        }
    }
}
