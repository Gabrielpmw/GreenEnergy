using System;
using System.ComponentModel.DataAnnotations;

namespace GreenEnergy.API.Models.DTOs
{
    public class CreateConfiguracaoAPIRequestDTO
    {
        [Required(ErrorMessage = "O nome da API é obrigatório.")]
        [StringLength(100, ErrorMessage = "O nome da API deve ter no máximo 100 caracteres.")]
        public string NomeAPI { get; set; } = string.Empty;

        [Required(ErrorMessage = "A chave de acesso é obrigatória.")]
        [StringLength(250, ErrorMessage = "A chave de acesso deve ter no máximo 250 caracteres.")]
        public string ChaveAcesso { get; set; } = string.Empty;

        [Required(ErrorMessage = "A URL base da API é obrigatória.")]
        [Url(ErrorMessage = "A URL base informada é inválida.")]
        [StringLength(500, ErrorMessage = "A URL base deve ter no máximo 500 caracteres.")]
        public string BaseUrl { get; set; } = string.Empty;
    }

    public class UpdateConfiguracaoAPIRequestDTO
    {
        [Required(ErrorMessage = "A chave de acesso é obrigatória.")]
        [StringLength(250, ErrorMessage = "A chave de acesso deve ter no máximo 250 caracteres.")]
        public string ChaveAcesso { get; set; } = string.Empty;

        [Required(ErrorMessage = "A URL base da API é obrigatória.")]
        [Url(ErrorMessage = "A URL base informada é inválida.")]
        [StringLength(500, ErrorMessage = "A URL base deve ter no máximo 500 caracteres.")]
        public string BaseUrl { get; set; } = string.Empty;
    }

    public class ConfiguracaoAPIResponseDTO
    {
        public int Id { get; set; }
        public string NomeAPI { get; set; } = string.Empty;
        public string ChaveAcesso { get; set; } = string.Empty;
        public string BaseUrl { get; set; } = string.Empty;
        public DateTime AtualizadoEm { get; set; }
    }
}
