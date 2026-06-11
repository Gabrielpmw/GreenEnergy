using System.Collections.Generic;

namespace GreenEnergy.API.Models.Entities
{
    public class CategoriaAparelho : BaseEntity
    {
        public string Nome { get; set; } = string.Empty;
        public string? Descricao { get; set; }
        public string? IconeUrl { get; set; }

        // Propriedades de Navegação
        public virtual ICollection<Dispositivo> Dispositivos { get; set; } = new List<Dispositivo>();
    }
}
