using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using GreenEnergy.API.Models.DTOs;
using GreenEnergy.API.Models.Entities;
using GreenEnergy.API.Repositories;

namespace GreenEnergy.API.Services
{
    public class UsuarioService : IUsuarioService
    {
        private readonly IUsuarioRepository _usuarioRepository;

        public UsuarioService(IUsuarioRepository usuarioRepository)
        {
            _usuarioRepository = usuarioRepository;
        }

        public async Task<ApiResponse<IEnumerable<UsuarioResponseDTO>>> ListUsersAsync(UsuarioRole? role = null)
        {
            var usuarios = await _usuarioRepository.ListAllAsync(role);
            var dtos = usuarios.Select(u => new UsuarioResponseDTO
            {
                Id = u.Id,
                Nome = u.Nome,
                Email = u.Email,
                Role = u.Role.ToString(),
                IsActive = u.IsActive,
                CriadoEm = u.CriadoEm
            });

            return new ApiResponse<IEnumerable<UsuarioResponseDTO>>(dtos, "Usuários listados com sucesso.");
        }

        public async Task<ApiResponse<UsuarioDetalhadoResponseDTO>> GetUserByIdAsync(int id, int requestUserId, string requestUserRole)
        {
            // Regra: Somente o próprio usuário ou o Admin podem visualizar os dados detalhados do perfil
            if (requestUserRole != "Admin" && requestUserId != id)
            {
                return new ApiResponse<UsuarioDetalhadoResponseDTO>("Acesso negado. Você não tem permissão para visualizar o perfil deste usuário.");
            }

            var usuario = await _usuarioRepository.GetByIdAsync(id);
            if (usuario == null)
            {
                return new ApiResponse<UsuarioDetalhadoResponseDTO>("Usuário não encontrado.");
            }

            var dto = MapToDetailedResponse(usuario);
            return new ApiResponse<UsuarioDetalhadoResponseDTO>(dto);
        }

        public async Task<ApiResponse<UsuarioResponseDTO>> CreateOperatorAsync(CreateOperadorRequestDTO dto)
        {
            // Validar e-mail duplicado
            bool emailExists = await _usuarioRepository.EmailExistsAsync(dto.Email);
            if (emailExists)
            {
                return new ApiResponse<UsuarioResponseDTO>("O e-mail informado já está cadastrado.");
            }

            var operador = new Usuario
            {
                Nome = dto.Nome,
                Email = dto.Email,
                SenhaHash = BCrypt.Net.BCrypt.HashPassword(dto.Senha),
                Role = UsuarioRole.Operador,
                Perfil = new Perfil
                {
                    Telefone = dto.Telefone,
                    Documento = dto.Documento
                }
            };

            await _usuarioRepository.AddAsync(operador);

            var responseDto = MapToResponse(operador);
            return new ApiResponse<UsuarioResponseDTO>(responseDto, "Operador cadastrado com sucesso!");
        }

        public async Task<ApiResponse<UsuarioResponseDTO>> UpdateOwnProfileAsync(int id, UpdateUsuarioRequestDTO userDto, UpdatePerfilRequestDTO profileDto)
        {
            var usuario = await _usuarioRepository.GetByIdAsync(id);
            if (usuario == null)
            {
                return new ApiResponse<UsuarioResponseDTO>("Usuário não encontrado.");
            }

            // Validar se o e-mail mudou e se o novo e-mail já existe
            if (!usuario.Email.Equals(userDto.Email, StringComparison.InvariantCultureIgnoreCase))
            {
                bool emailExists = await _usuarioRepository.EmailExistsAsync(userDto.Email);
                if (emailExists)
                {
                    return new ApiResponse<UsuarioResponseDTO>("O novo e-mail informado já está cadastrado.");
                }
                usuario.Email = userDto.Email;
            }

            usuario.Nome = userDto.Nome;

            // Se uma nova senha for fornecida, rehash e atualiza
            if (!string.IsNullOrWhiteSpace(userDto.Senha))
            {
                usuario.SenhaHash = BCrypt.Net.BCrypt.HashPassword(userDto.Senha);
            }

            // Atualizar perfil
            if (usuario.Perfil == null)
            {
                usuario.Perfil = new Perfil();
            }
            usuario.Perfil.Telefone = profileDto.Telefone;
            usuario.Perfil.Documento = profileDto.Documento;
            usuario.Perfil.AvatarUrl = profileDto.AvatarUrl;

            await _usuarioRepository.UpdateAsync(usuario);

            var responseDto = MapToResponse(usuario);
            return new ApiResponse<UsuarioResponseDTO>(responseDto, "Seu perfil foi atualizado com sucesso!");
        }

        public async Task<ApiResponse<UsuarioResponseDTO>> UpdateOperatorAsync(int id, CreateOperadorRequestDTO dto)
        {
            var usuario = await _usuarioRepository.GetByIdAsync(id);
            if (usuario == null)
            {
                return new ApiResponse<UsuarioResponseDTO>("Operador não encontrado.");
            }

            // Regra: Não permitir mudar o papel (role) e apenas operadores podem ser atualizados via este método
            if (usuario.Role != UsuarioRole.Operador)
            {
                return new ApiResponse<UsuarioResponseDTO>("Ação não permitida. Apenas contas de Operadores podem ser atualizadas por este método.");
            }

            // Validar se o e-mail mudou e se o novo e-mail já existe
            if (!usuario.Email.Equals(dto.Email, StringComparison.InvariantCultureIgnoreCase))
            {
                bool emailExists = await _usuarioRepository.EmailExistsAsync(dto.Email);
                if (emailExists)
                {
                    return new ApiResponse<UsuarioResponseDTO>("O novo e-mail informado já está cadastrado.");
                }
                usuario.Email = dto.Email;
            }

            usuario.Nome = dto.Nome;

            // Se a senha for enviada (diferente da antiga/não-vazia), atualiza
            if (!string.IsNullOrWhiteSpace(dto.Senha))
            {
                usuario.SenhaHash = BCrypt.Net.BCrypt.HashPassword(dto.Senha);
            }

            // Atualizar dados de perfil do operador
            if (usuario.Perfil == null)
            {
                usuario.Perfil = new Perfil();
            }
            usuario.Perfil.Telefone = dto.Telefone;
            usuario.Perfil.Documento = dto.Documento;

            await _usuarioRepository.UpdateAsync(usuario);

            var responseDto = MapToResponse(usuario);
            return new ApiResponse<UsuarioResponseDTO>(responseDto, "Operador atualizado com sucesso!");
        }

        public async Task<ApiResponse<bool>> ToggleUserActiveStateAsync(int id, bool active)
        {
            // Usamos includeDeleted para podermos reativar usuários soft-deletados
            var usuario = await _usuarioRepository.GetByIdAsync(id, includeDeleted: true);
            if (usuario == null)
            {
                return new ApiResponse<bool>("Usuário não encontrado.");
            }

            // Impedir que o Administrador desative a si próprio (autoproteção do cockpit)
            if (usuario.Role == UsuarioRole.Admin && !active)
            {
                return new ApiResponse<bool>("Ação não permitida. O Administrador Geral não pode desativar a si próprio.");
            }

            usuario.IsActive = active;
            usuario.IsDeleted = !active; // Soft delete se desativado

            // Também desativar/deletar o perfil complementar associado
            if (usuario.Perfil != null)
            {
                usuario.Perfil.IsActive = active;
                usuario.Perfil.IsDeleted = !active;
            }

            await _usuarioRepository.UpdateAsync(usuario);

            string mensagem = active ? "Usuário ativado com sucesso!" : "Usuário desativado (soft delete) com sucesso!";
            return new ApiResponse<bool>(true, mensagem);
        }

        private static UsuarioResponseDTO MapToResponse(Usuario usuario)
        {
            return new UsuarioResponseDTO
            {
                Id = usuario.Id,
                Nome = usuario.Nome,
                Email = usuario.Email,
                Role = usuario.Role.ToString(),
                IsActive = usuario.IsActive,
                CriadoEm = usuario.CriadoEm
            };
        }

        private static UsuarioDetalhadoResponseDTO MapToDetailedResponse(Usuario usuario)
        {
            var detalhe = new UsuarioDetalhadoResponseDTO
            {
                Id = usuario.Id,
                Nome = usuario.Nome,
                Email = usuario.Email,
                Role = usuario.Role.ToString(),
                IsActive = usuario.IsActive,
                CriadoEm = usuario.CriadoEm
            };

            if (usuario.Perfil != null)
            {
                detalhe.Perfil = new PerfilResponseDTO
                {
                    UsuarioId = usuario.Perfil.UsuarioId,
                    Telefone = usuario.Perfil.Telefone,
                    Documento = usuario.Perfil.Documento,
                    AvatarUrl = usuario.Perfil.AvatarUrl
                };
            }

            return detalhe;
        }
    }
}
