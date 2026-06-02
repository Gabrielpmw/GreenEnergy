using System;
using System.Collections.Generic;

namespace GreenEnergy.API.Models.Entities
{
    public class Usuario : BaseEntity
    {
        public string Nome { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string SenhaHash { get; set; } = string.Empty;
        public UsuarioRole Role { get; set; }
        public DateTime CriadoEm { get; set; } = DateTime.UtcNow;
        public string? RefreshToken { get; set; }
        public DateTime? RefreshTokenExpiracao { get; set; }

        // Propriedades de Navegação
        public virtual Perfil? Perfil { get; set; }
        public virtual ICollection<AuditLog> AuditLogs { get; set; } = new List<AuditLog>();
        public virtual ICollection<Alerta> Alertas { get; set; } = new List<Alerta>();
        public virtual ICollection<UnidadeConsumidora> UnidadesConsumidoras { get; set; } = new List<UnidadeConsumidora>();
        public virtual ICollection<Chamado> ChamadosCliente { get; set; } = new List<Chamado>();
        public virtual ICollection<Chamado> ChamadosOperador { get; set; } = new List<Chamado>();
        public virtual ICollection<Meta> MetasAvaliadas { get; set; } = new List<Meta>();
    }
}
