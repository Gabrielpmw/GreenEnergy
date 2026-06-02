namespace GreenEnergy.API.Models.Entities
{
    public class Meta : BaseEntity
    {
        public int DispositivoId { get; set; }
        public int? OperadorId { get; set; }
        public TipoMeta TipoMeta { get; set; }
        public double ValorLimite { get; set; }
        public string Justificativa { get; set; } = string.Empty;
        public MetaStatus Status { get; set; } = MetaStatus.Proposta;
        public string? AvaliacaoObs { get; set; }

        // Propriedades de Navegação
        public virtual Dispositivo Dispositivo { get; set; } = null!;
        public virtual Usuario? Operador { get; set; }
    }
}
