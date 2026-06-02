using System;

namespace GreenEnergy.API.Models.Entities
{
    public class AuditLog
    {
        public int Id { get; set; }
        public int? UsuarioId { get; set; }
        public string Acao { get; set; } = string.Empty;
        public string Entidade { get; set; } = string.Empty;
        public string EntidadeId { get; set; } = string.Empty;
        public string? DadosAnteriores { get; set; }
        public string? DadosNovos { get; set; }
        public string? IP { get; set; }
        public DateTime Timestamp { get; set; } = DateTime.UtcNow;

        // Propriedade de Navegação
        public virtual Usuario? Usuario { get; set; }
    }
}
