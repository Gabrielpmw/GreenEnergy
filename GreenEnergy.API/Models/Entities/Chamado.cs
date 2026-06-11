using System;
using System.Collections.Generic;

namespace GreenEnergy.API.Models.Entities
{
    public class Chamado : BaseEntity
    {
        public int ClienteId { get; set; }
        public int? OperadorId { get; set; }
        public int DispositivoId { get; set; }
        public TipoChamado Tipo { get; set; }
        public ChamadoStatus Status { get; set; } = ChamadoStatus.Pendente;
        public string Descricao { get; set; } = string.Empty;
        public DateTime CriadoEm { get; set; } = DateTime.UtcNow;

        // Propriedades de Navegação
        public virtual Usuario Cliente { get; set; } = null!;
        public virtual Usuario? Operador { get; set; }
        public virtual Dispositivo Dispositivo { get; set; } = null!;
        public virtual ICollection<RelatorioTecnico> RelatoriosTecnicos { get; set; } = new List<RelatorioTecnico>();
    }
}
