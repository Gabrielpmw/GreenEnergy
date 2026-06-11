using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using GreenEnergy.API.Middleware;
using GreenEnergy.API.Models.DTOs;
using GreenEnergy.API.Services;

namespace GreenEnergy.API.Controllers
{
    [ApiController]
    [Route("api/v1/auth")]
    [Produces("application/json")]
    public class AuthController : ControllerBase
    {
        private readonly IAuthService _authService;

        public AuthController(IAuthService authService)
        {
            _authService = authService;
        }

        /// <summary>
        /// Realiza o autocadastro (Onboarding) de um novo Cliente no sistema.
        /// </summary>
        /// <param name="dto">Dados para cadastro do cliente.</param>
        /// <returns>Dados do usuário cadastrado embalados no ApiResponse.</returns>
        /// <response code="200">Retorna o usuário cadastrado com sucesso.</response>
        /// <response code="400">Se houver algum erro de validação ou e-mail duplicado.</response>
        [HttpPost("register")]
        [ProducesResponseType(typeof(ApiResponse<UsuarioResponseDTO>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponse<UsuarioResponseDTO>), StatusCodes.Status400BadRequest)]
        [ServiceFilter(typeof(AuditLogFilter))]
        [AuditLog("Autocadastro de Cliente", "Usuario")]
        public async Task<IActionResult> Register([FromBody] RegisterRequestDTO dto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(new ApiResponse<UsuarioResponseDTO>("Dados inválidos."));
            }

            var result = await _authService.RegisterClientAsync(dto);
            if (!result.Success)
            {
                return BadRequest(result);
            }

            return Ok(result);
        }

        /// <summary>
        /// Efetua a autenticação do usuário retornando um token de acesso JWT e Refresh Token.
        /// </summary>
        /// <param name="dto">Credenciais do usuário (e-mail e senha).</param>
        /// <returns>Tokens de autenticação JWT e dados básicos do perfil.</returns>
        /// <response code="200">Retorna o token gerado com sucesso.</response>
        /// <response code="400">Se as credenciais forem inválidas ou inativas.</response>
        [HttpPost("login")]
        [ProducesResponseType(typeof(ApiResponse<LoginResponseDTO>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponse<LoginResponseDTO>), StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> Login([FromBody] LoginRequestDTO dto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(new ApiResponse<LoginResponseDTO>("Dados de login inválidos."));
            }

            var result = await _authService.LoginAsync(dto);
            if (!result.Success)
            {
                return BadRequest(result);
            }

            return Ok(result);
        }

        /// <summary>
        /// Renova o token de acesso JWT expirado a partir de um Refresh Token válido.
        /// </summary>
        /// <param name="dto">Token de acesso expirado e o refresh token correspondente.</param>
        /// <returns>Novos tokens de autenticação gerados.</returns>
        /// <response code="200">Token renovado com sucesso.</response>
        /// <response code="400">Se o Refresh Token estiver expirado ou for inválido.</response>
        [HttpPost("refresh")]
        [ProducesResponseType(typeof(ApiResponse<LoginResponseDTO>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponse<LoginResponseDTO>), StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> Refresh([FromBody] RefreshTokenRequestDTO dto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(new ApiResponse<LoginResponseDTO>("Dados de atualização inválidos."));
            }

            var result = await _authService.RefreshTokenAsync(dto);
            if (!result.Success)
            {
                return BadRequest(result);
            }

            return Ok(result);
        }

        /// <summary>
        /// Efetua o logout do usuário atual invalidando seu Refresh Token no banco de dados.
        /// </summary>
        /// <returns>Confirmação do logout.</returns>
        /// <response code="200">Logout realizado com sucesso.</response>
        /// <response code="401">Se a requisição não estiver autenticada.</response>
        [HttpPost("logout")]
        [Authorize]
        [ProducesResponseType(typeof(ApiResponse<bool>), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        public async Task<IActionResult> Logout()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out int userId))
            {
                return Unauthorized();
            }

            var result = await _authService.LogoutAsync(userId);
            if (!result.Success)
            {
                return BadRequest(result);
            }

            return Ok(result);
        }
    }
}
