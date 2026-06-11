namespace GreenEnergy.API.Models.Entities
{
    public class Perfil : BaseEntity
    {
        public int UsuarioId { get; set; }
        public string Telefone { get; set; } = string.Empty;
        public string Documento { get; set; } = string.Empty;
        public string? AvatarUrl { get; set; }

        // Propriedade de Navegação
        public virtual Usuario Usuario { get; set; } = null!;
    }
}
