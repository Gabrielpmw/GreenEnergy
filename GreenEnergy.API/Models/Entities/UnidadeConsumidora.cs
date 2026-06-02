using System.Collections.Generic;

namespace GreenEnergy.API.Models.Entities
{
    public class UnidadeConsumidora : BaseEntity
    {
        public int UsuarioId { get; set; }
        public TipoImovel TipoImovel { get; set; }
        public string CEP { get; set; } = string.Empty;
        public string CodigoIBGE { get; set; } = string.Empty;
        public string Cidade { get; set; } = string.Empty;
        public string Estado { get; set; } = string.Empty;

        // Propriedades de Navegação
        public virtual Usuario Usuario { get; set; } = null!;
        public virtual Endereco? Endereco { get; set; }
        public virtual ICollection<Dispositivo> Dispositivos { get; set; } = new List<Dispositivo>();
    }
}
