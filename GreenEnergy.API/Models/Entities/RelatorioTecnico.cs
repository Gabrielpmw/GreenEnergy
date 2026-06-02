using System;

namespace GreenEnergy.API.Models.Entities
{
    public class RelatorioTecnico : BaseEntity
    {
        public int ChamadoId { get; set; }
        public int OperadorId { get; set; }
        public string Conteudo { get; set; } = string.Empty;
        public TipoOcorrencia TipoOcorrencia { get; set; }
        public DateTime CriadoEm { get; set; } = DateTime.UtcNow;

        // Propriedades de Navegação
        public virtual Chamado Chamado { get; set; } = null!;
        public virtual Usuario Operador { get; set; } = null!;
    }
}
