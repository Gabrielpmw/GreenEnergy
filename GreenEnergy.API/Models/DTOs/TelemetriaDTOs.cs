using System;

namespace GreenEnergy.API.Models.DTOs
{
    public class TelemetriaResponseDTO
    {
        public int Id { get; set; }
        public int SensorId { get; set; }
        public double ConsumoKWh { get; set; }
        public double TensaoV { get; set; }
        public double CorrenteA { get; set; }
        public DateTime RegistradoEm { get; set; }
    }
}
