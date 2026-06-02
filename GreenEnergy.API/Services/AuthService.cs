using System;
using System.Collections.Generic;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using GreenEnergy.API.Models.DTOs;
using GreenEnergy.API.Models.Entities;
using GreenEnergy.API.Repositories;

namespace GreenEnergy.API.Services
{
    public class AuthService : IAuthService
    {
        private readonly IUsuarioRepository _usuarioRepository;
        private readonly IConfiguration _configuration;

        public AuthService(IUsuarioRepository usuarioRepository, IConfiguration configuration)
        {
            _usuarioRepository = usuarioRepository;
            _configuration = configuration;
        }

        public async Task<ApiResponse<LoginResponseDTO>> LoginAsync(LoginRequestDTO dto)
        {
            var usuario = await _usuarioRepository.GetByEmailAsync(dto.Email);
            if (usuario == null || !usuario.IsActive || usuario.IsDeleted)
            {
                return new ApiResponse<LoginResponseDTO>("E-mail ou senha incorretos.");
            }

            // Validar senha com BCrypt
            bool isSenhaValida = BCrypt.Net.BCrypt.Verify(dto.Senha, usuario.SenhaHash);
            if (!isSenhaValida)
            {
                return new ApiResponse<LoginResponseDTO>("E-mail ou senha incorretos.");
            }

            // Gerar tokens
            var response = await GenerateUserTokensAsync(usuario);
            return new ApiResponse<LoginResponseDTO>(response, "Login realizado com sucesso.");
        }

        public async Task<ApiResponse<UsuarioResponseDTO>> RegisterClientAsync(RegisterRequestDTO dto)
        {
            // Validar e-mail duplicado
            bool emailExists = await _usuarioRepository.EmailExistsAsync(dto.Email);
            if (emailExists)
            {
                return new ApiResponse<UsuarioResponseDTO>("O e-mail informado já está cadastrado.");
            }

            var novoUsuario = new Usuario
            {
                Nome = dto.Nome,
                Email = dto.Email,
                SenhaHash = BCrypt.Net.BCrypt.HashPassword(dto.Senha),
                Role = UsuarioRole.Cliente,
                Perfil = new Perfil
                {
                    Telefone = dto.Telefone,
                    Documento = dto.Documento
                }
            };

            await _usuarioRepository.AddAsync(novoUsuario);

            var responseDto = new UsuarioResponseDTO
            {
                Id = novoUsuario.Id,
                Nome = novoUsuario.Nome,
                Email = novoUsuario.Email,
                Role = novoUsuario.Role.ToString(),
                IsActive = novoUsuario.IsActive,
                CriadoEm = novoUsuario.CriadoEm
            };

            return new ApiResponse<UsuarioResponseDTO>(responseDto, "Cliente cadastrado com sucesso!");
        }

        public async Task<ApiResponse<LoginResponseDTO>> RefreshTokenAsync(RefreshTokenRequestDTO dto)
        {
            var principal = GetPrincipalFromExpiredToken(dto.Token);
            if (principal == null)
            {
                return new ApiResponse<LoginResponseDTO>("Token de acesso inválido.");
            }

            var userIdClaim = principal.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out int userId))
            {
                return new ApiResponse<LoginResponseDTO>("Token de acesso inválido.");
            }

            var usuario = await _usuarioRepository.GetByIdAsync(userId);
            if (usuario == null || usuario.IsDeleted || !usuario.IsActive)
            {
                return new ApiResponse<LoginResponseDTO>("Usuário inativo ou excluído.");
            }

            // Validar Refresh Token
            if (usuario.RefreshToken != dto.RefreshToken || usuario.RefreshTokenExpiracao <= DateTime.UtcNow)
            {
                return new ApiResponse<LoginResponseDTO>("Token de atualização expirado ou inválido.");
            }

            // Gerar novos tokens
            var response = await GenerateUserTokensAsync(usuario);
            return new ApiResponse<LoginResponseDTO>(response, "Token atualizado com sucesso.");
        }

        public async Task<ApiResponse<bool>> LogoutAsync(int userId)
        {
            var usuario = await _usuarioRepository.GetByIdAsync(userId);
            if (usuario == null)
            {
                return new ApiResponse<bool>("Usuário não encontrado.");
            }

            // Invalidar Refresh Token no logout
            usuario.RefreshToken = null;
            usuario.RefreshTokenExpiracao = null;

            await _usuarioRepository.UpdateAsync(usuario);
            return new ApiResponse<bool>(true, "Logout realizado com sucesso.");
        }

        private async Task<LoginResponseDTO> GenerateUserTokensAsync(Usuario usuario)
        {
            var jwtSection = _configuration.GetSection("Jwt");
            var expiryMinutes = double.TryParse(jwtSection["ExpiryMinutes"], out var parsed) ? parsed : 60;
            var tokenExpiration = DateTime.UtcNow.AddMinutes(expiryMinutes);

            // Gerar Access Token JWT
            string accessToken = GenerateAccessToken(usuario, tokenExpiration);

            // Gerar Refresh Token
            string refreshToken = GenerateSecureRefreshToken();
            
            // Persistir Refresh Token no banco (expiração de 7 dias padrão)
            usuario.RefreshToken = refreshToken;
            usuario.RefreshTokenExpiracao = DateTime.UtcNow.AddDays(7);
            await _usuarioRepository.UpdateAsync(usuario);

            return new LoginResponseDTO
            {
                Token = accessToken,
                RefreshToken = refreshToken,
                Expiracao = tokenExpiration,
                Role = usuario.Role.ToString(),
                UsuarioId = usuario.Id,
                Nome = usuario.Nome
            };
        }

        private string GenerateAccessToken(Usuario usuario, DateTime expiration)
        {
            var tokenHandler = new JwtSecurityTokenHandler();
            var secretKey = _configuration["Jwt:Secret"] ?? "GreenEnergySuperSecretJwtKeyForAuthentication2026!";
            var key = Encoding.ASCII.GetBytes(secretKey);

            var tokenDescriptor = new SecurityTokenDescriptor
            {
                Subject = new ClaimsIdentity(new[]
                {
                    new Claim(ClaimTypes.NameIdentifier, usuario.Id.ToString()),
                    new Claim(ClaimTypes.Name, usuario.Nome),
                    new Claim(ClaimTypes.Email, usuario.Email),
                    new Claim(ClaimTypes.Role, usuario.Role.ToString())
                }),
                Expires = expiration,
                Issuer = _configuration["Jwt:Issuer"] ?? "GreenEnergyAPI",
                Audience = _configuration["Jwt:Audience"] ?? "GreenEnergyFrontend",
                SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(key), SecurityAlgorithms.HmacSha256Signature)
            };

            var token = tokenHandler.CreateToken(tokenDescriptor);
            return tokenHandler.WriteToken(token);
        }

        private static string GenerateSecureRefreshToken()
        {
            var randomNumber = new byte[64];
            using var rng = RandomNumberGenerator.Create();
            rng.GetBytes(randomNumber);
            return Convert.ToBase64String(randomNumber);
        }

        private ClaimsPrincipal? GetPrincipalFromExpiredToken(string token)
        {
            var secretKey = _configuration["Jwt:Secret"] ?? "GreenEnergySuperSecretJwtKeyForAuthentication2026!";
            var key = Encoding.ASCII.GetBytes(secretKey);

            var tokenValidationParameters = new TokenValidationParameters
            {
                ValidateAudience = true,
                ValidAudience = _configuration["Jwt:Audience"] ?? "GreenEnergyFrontend",
                ValidateIssuer = true,
                ValidIssuer = _configuration["Jwt:Issuer"] ?? "GreenEnergyAPI",
                ValidateIssuerSigningKey = true,
                IssuerSigningKey = new SymmetricSecurityKey(key),
                ValidateLifetime = false // Ignorar Lifetime para validar token expirado
            };

            var tokenHandler = new JwtSecurityTokenHandler();
            try
            {
                var principal = tokenHandler.ValidateToken(token, tokenValidationParameters, out SecurityToken securityToken);
                if (securityToken is not JwtSecurityToken jwtSecurityToken ||
                    !jwtSecurityToken.Header.Alg.Equals(SecurityAlgorithms.HmacSha256, StringComparison.InvariantCultureIgnoreCase))
                {
                    return null;
                }
                return principal;
            }
            catch
            {
                return null;
            }
        }
    }
}
