using System;
using System.Collections.Generic;

namespace GreenEnergy.API.Models.Entities
{
    public class Dispositivo : BaseEntity
    {
        public int UnidadeConsumidoraId { get; set; }
        public int CategoriaId { get; set; }
        public string Nome { get; set; } = string.Empty;
        public string TipoAparelho { get; set; } = string.Empty;
        public string? Descricao { get; set; }
        public double PotenciaWatts { get; set; }
        public DispositivoStatus Status { get; set; } = DispositivoStatus.Ativo;
        public DateTime CriadoEm { get; set; } = DateTime.UtcNow;

        // Propriedades de Navegação
        public virtual UnidadeConsumidora UnidadeConsumidora { get; set; } = null!;
        public virtual CategoriaAparelho Categoria { get; set; } = null!;
        public virtual Sensor? Sensor { get; set; }
        public virtual ICollection<Telemetria> Telemetrias { get; set; } = new List<Telemetria>();
        public virtual ICollection<Meta> Metas { get; set; } = new List<Meta>();
        public virtual ICollection<AnotacaoDispositivo> Anotacoes { get; set; } = new List<AnotacaoDispositivo>();
        public virtual ICollection<Chamado> Chamados { get; set; } = new List<Chamado>();
        public virtual ICollection<Alerta> Alertas { get; set; } = new List<Alerta>();
    }
}
