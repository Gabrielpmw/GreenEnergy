using System;
using System.ComponentModel.DataAnnotations;

namespace GreenEnergy.API.Models.DTOs
{
    public class CreateOperadorRequestDTO
    {
        [Required(ErrorMessage = "O nome é obrigatório.")]
        [StringLength(100, MinimumLength = 3, ErrorMessage = "O nome deve ter entre 3 e 100 caracteres.")]
        public string Nome { get; set; } = string.Empty;

        [Required(ErrorMessage = "O e-mail é obrigatório.")]
        [EmailAddress(ErrorMessage = "O e-mail informado é inválido.")]
        public string Email { get; set; } = string.Empty;

        [Required(ErrorMessage = "A senha é obrigatória.")]
        [StringLength(100, MinimumLength = 8, ErrorMessage = "A senha deve ter no mínimo 8 caracteres.")]
        [RegularExpression(@"^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$", 
            ErrorMessage = "A senha deve conter pelo menos uma letra maiúscula, uma letra minúscula, um número e um caractere especial.")]
        public string Senha { get; set; } = string.Empty;

        [Required(ErrorMessage = "O telefone é obrigatório.")]
        [RegularExpression(@"^\(?\d{2}\)?\s?\d{4,5}-?\d{4}$", ErrorMessage = "O telefone deve estar em formato válido.")]
        public string Telefone { get; set; } = string.Empty;

        [Required(ErrorMessage = "O documento é obrigatório.")]
        [RegularExpression(@"^\d{3}\.?\d{3}\.?\d{3}-?\d{2}$|^\d{2}\.?\d{3}\.?\d{3}/?\d{4}-?\d{2}$", 
            ErrorMessage = "O documento deve ser um CPF ou CNPJ válido.")]
        public string Documento { get; set; } = string.Empty;
    }

    public class UpdateUsuarioRequestDTO
    {
        [Required(ErrorMessage = "O nome é obrigatório.")]
        [StringLength(100, MinimumLength = 3, ErrorMessage = "O nome deve ter entre 3 e 100 caracteres.")]
        public string Nome { get; set; } = string.Empty;

        [Required(ErrorMessage = "O e-mail é obrigatório.")]
        [EmailAddress(ErrorMessage = "O e-mail informado é inválido.")]
        public string Email { get; set; } = string.Empty;

        // Opcional: Se fornecido, será validado e atualizado. Se nulo ou vazio, mantém a senha atual.
        [StringLength(100, MinimumLength = 8, ErrorMessage = "A nova senha deve ter no mínimo 8 caracteres.")]
        [RegularExpression(@"^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$", 
            ErrorMessage = "A nova senha deve conter pelo menos uma letra maiúscula, uma letra minúscula, um número e um caractere especial.")]
        public string? Senha { get; set; }
    }

    public class UpdatePerfilRequestDTO
    {
        [Required(ErrorMessage = "O telefone é obrigatório.")]
        [RegularExpression(@"^\(?\d{2}\)?\s?\d{4,5}-?\d{4}$", ErrorMessage = "O telefone deve estar em formato válido.")]
        public string Telefone { get; set; } = string.Empty;

        [Required(ErrorMessage = "O documento é obrigatório.")]
        [RegularExpression(@"^\d{3}\.?\d{3}\.?\d{3}-?\d{2}$|^\d{2}\.?\d{3}\.?\d{3}/?\d{4}-?\d{2}$", 
            ErrorMessage = "O documento deve ser um CPF ou CNPJ válido.")]
        public string Documento { get; set; } = string.Empty;

        public string? AvatarUrl { get; set; }
    }

    public class UsuarioResponseDTO
    {
        public int Id { get; set; }
        public string Nome { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Role { get; set; } = string.Empty;
        public bool IsActive { get; set; }
        public DateTime CriadoEm { get; set; }
    }

    public class PerfilResponseDTO
    {
        public int UsuarioId { get; set; }
        public string Telefone { get; set; } = string.Empty;
        public string Documento { get; set; } = string.Empty;
        public string? AvatarUrl { get; set; }
    }

    public class UsuarioDetalhadoResponseDTO
    {
        public int Id { get; set; }
        public string Nome { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Role { get; set; } = string.Empty;
        public bool IsActive { get; set; }
        public DateTime CriadoEm { get; set; }
        public PerfilResponseDTO? Perfil { get; set; }
    }

    public class UpdateProfileRequestWrapper
    {
        [Required(ErrorMessage = "Os dados do usuário são obrigatórios.")]
        public UpdateUsuarioRequestDTO Usuario { get; set; } = null!;

        [Required(ErrorMessage = "Os dados do perfil são obrigatórios.")]
        public UpdatePerfilRequestDTO Perfil { get; set; } = null!;
    }
}
