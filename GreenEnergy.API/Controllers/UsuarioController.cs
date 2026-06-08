using System.Collections.Generic;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using GreenEnergy.API.Middleware;
using GreenEnergy.API.Models.DTOs;
using GreenEnergy.API.Models.Entities;
using GreenEnergy.API.Services;

namespace GreenEnergy.API.Controllers
{
    [ApiController]
    [Route("api/v1/usuarios")]
    [Produces("application/json")]
    [Authorize]
    public class UsuarioController : ControllerBase
    {
        private readonly IUsuarioService _usuarioService;

        public UsuarioController(IUsuarioService usuarioService)
        {
            _usuarioService = usuarioService;
        }

        /// <summary>
        /// Lista todos os usuários do sistema. Apenas Administradores têm acesso.
        /// </summary>
        /// <returns>Lista de usuários cadastrados.</returns>
        /// <response code="200">Retorna a lista de usuários.</response>
        /// <response code="401">Se não autenticado.</response>
        /// <response code="403">Se o usuário logado não for Administrador.</response>
        [HttpGet]
        [Authorize(Roles = "Admin")]
        [ProducesResponseType(typeof(ApiResponse<IEnumerable<UsuarioResponseDTO>>), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(StatusCodes.Status403Forbidden)]
        public async Task<IActionResult> GetAll()
        {
            var result = await _usuarioService.ListUsersAsync();
            return Ok(result);
        }

        /// <summary>
        /// Lista todos os Clientes cadastrados. Apenas Administradores e Operadores têm acesso.
        /// </summary>
        /// <returns>Lista de clientes do sistema.</returns>
        /// <response code="200">Retorna a lista de clientes.</response>
        [HttpGet("clientes")]
        [Authorize(Roles = "Admin,Operador")]
        [ProducesResponseType(typeof(ApiResponse<IEnumerable<UsuarioResponseDTO>>), StatusCodes.Status200OK)]
        public async Task<IActionResult> GetClientes()
        {
            var result = await _usuarioService.ListUsersAsync(UsuarioRole.Cliente);
            return Ok(result);
        }

        /// <summary>
        /// Lista todos os Operadores cadastrados. Apenas Administradores têm acesso.
        /// </summary>
        /// <returns>Lista de operadores do sistema.</returns>
        /// <response code="200">Retorna a lista de operadores.</response>
        [HttpGet("operadores")]
        [Authorize(Roles = "Admin")]
        [ProducesResponseType(typeof(ApiResponse<IEnumerable<UsuarioResponseDTO>>), StatusCodes.Status200OK)]
        public async Task<IActionResult> GetOperadores()
        {
            var result = await _usuarioService.ListUsersAsync(UsuarioRole.Operador);
            return Ok(result);
        }

        /// <summary>
        /// Obtém o perfil detalhado de um usuário por ID.
        /// Acesso permitido apenas ao Administrador ou ao próprio usuário dono da conta.
        /// </summary>
        /// <param name="id">ID do usuário pesquisado.</param>
        /// <returns>Detalhes completos do usuário e seu perfil.</returns>
        /// <response code="200">Retorna o perfil detalhado.</response>
        /// <response code="403">Se acesso for negado (não for o próprio ou admin).</response>
        /// <response code="440">Se usuário não for encontrado.</response>
        [HttpGet("{id}")]
        [ProducesResponseType(typeof(ApiResponse<UsuarioDetalhadoResponseDTO>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponse<UsuarioDetalhadoResponseDTO>), StatusCodes.Status403Forbidden)]
        [ProducesResponseType(typeof(ApiResponse<UsuarioDetalhadoResponseDTO>), StatusCodes.Status404NotFound)]
        public async Task<IActionResult> GetById(int id)
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            var userRoleClaim = User.FindFirst(ClaimTypes.Role)?.Value;

            if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out int loggedInUserId) || string.IsNullOrEmpty(userRoleClaim))
            {
                return Unauthorized();
            }

            var result = await _usuarioService.GetUserByIdAsync(id, loggedInUserId, userRoleClaim);
            if (!result.Success)
            {
                if (result.Message?.Contains("Acesso negado") == true)
                {
                    return StatusCode(StatusCodes.Status403Forbidden, result);
                }
                return NotFound(result);
            }

            return Ok(result);
        }

        /// <summary>
        /// Cadastra um novo Operador de campo no sistema. Apenas Administradores têm acesso.
        /// </summary>
        /// <param name="dto">Dados de cadastro do operador.</param>
        /// <returns>Dados do operador criado.</returns>
        /// <response code="200">Operador criado com sucesso.</response>
        /// <response code="400">Se o e-mail ou documento for inválido ou já cadastrado.</response>
        [HttpPost("operadores")]
        [Authorize(Roles = "Admin")]
        [ProducesResponseType(typeof(ApiResponse<UsuarioResponseDTO>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponse<UsuarioResponseDTO>), StatusCodes.Status400BadRequest)]
        [ServiceFilter(typeof(AuditLogFilter))]
        [AuditLog("Criar Operador", "Usuario")]
        public async Task<IActionResult> CreateOperator([FromBody] CreateOperadorRequestDTO dto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(new ApiResponse<UsuarioResponseDTO>("Dados inválidos."));
            }

            var result = await _usuarioService.CreateOperatorAsync(dto);
            if (!result.Success)
            {
                return BadRequest(result);
            }

            return Ok(result);
        }

        /// <summary>
        /// Atualiza os dados de acesso e perfil do próprio usuário autenticado (Cliente ou outro).
        /// Permite também a alteração opcional de senha e e-mail.
        /// </summary>
        /// <param name="id">ID do usuário a atualizar (deve ser idêntico ao usuário logado).</param>
        /// <param name="dto">Wrapper contendo os novos dados do usuário e perfil.</param>
        /// <returns>Dados do usuário atualizado.</returns>
        /// <response code="200">Perfil atualizado com sucesso.</response>
        /// <response code="403">Se tentar atualizar a conta de outro usuário.</response>
        [HttpPut("{id}")]
        [ProducesResponseType(typeof(ApiResponse<UsuarioResponseDTO>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponse<UsuarioResponseDTO>), StatusCodes.Status403Forbidden)]
        [ProducesResponseType(typeof(ApiResponse<UsuarioResponseDTO>), StatusCodes.Status400BadRequest)]
        [ServiceFilter(typeof(AuditLogFilter))]
        [AuditLog("Atualizar Perfil Próprio", "Usuario")]
        public async Task<IActionResult> UpdateOwnProfile(int id, [FromBody] UpdateProfileRequestWrapper dto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(new ApiResponse<UsuarioResponseDTO>("Dados inválidos."));
            }

            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out int loggedInUserId) || loggedInUserId != id)
            {
                return StatusCode(StatusCodes.Status403Forbidden, new ApiResponse<UsuarioResponseDTO>("Acesso negado. Você só pode atualizar o seu próprio perfil."));
            }

            var result = await _usuarioService.UpdateOwnProfileAsync(id, dto.Usuario, dto.Perfil);
            if (!result.Success)
            {
                return BadRequest(result);
            }

            return Ok(result);
        }

        /// <summary>
        /// Atualiza as credenciais e informações cadastrais de um Operador existente. Apenas Administradores têm acesso.
        /// </summary>
        /// <param name="id">ID do operador técnico.</param>
        /// <param name="dto">Novos dados cadastrais.</param>
        /// <returns>Dados atualizados do operador.</returns>
        /// <response code="200">Operador atualizado com sucesso.</response>
        [HttpPut("operadores/{id}")]
        [Authorize(Roles = "Admin")]
        [ProducesResponseType(typeof(ApiResponse<UsuarioResponseDTO>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponse<UsuarioResponseDTO>), StatusCodes.Status400BadRequest)]
        [ServiceFilter(typeof(AuditLogFilter))]
        [AuditLog("Atualizar Operador", "Usuario")]
        public async Task<IActionResult> UpdateOperator(int id, [FromBody] CreateOperadorRequestDTO dto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(new ApiResponse<UsuarioResponseDTO>("Dados inválidos."));
            }

            var result = await _usuarioService.UpdateOperatorAsync(id, dto);
            if (!result.Success)
            {
                return BadRequest(result);
            }

            return Ok(result);
        }

        /// <summary>
        /// Ativa/Reativa uma conta de usuário desativada (reverte soft delete). Apenas Administradores têm acesso.
        /// </summary>
        /// <param name="id">ID do usuário técnico ou cliente.</param>
        /// <returns>Confirmação de ativação.</returns>
        /// <response code="200">Usuário ativado com sucesso.</response>
        [HttpPatch("{id}/ativar")]
        [Authorize(Roles = "Admin")]
        [ProducesResponseType(typeof(ApiResponse<bool>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponse<bool>), StatusCodes.Status400BadRequest)]
        [ServiceFilter(typeof(AuditLogFilter))]
        [AuditLog("Reativar Usuário", "Usuario")]
        public async Task<IActionResult> Activar(int id)
        {
            var result = await _usuarioService.ToggleUserActiveStateAsync(id, active: true);
            if (!result.Success)
            {
                return BadRequest(result);
            }

            return Ok(result);
        }

        /// <summary>
        /// Desativa uma conta de usuário do sistema (executa o soft delete). Apenas Administradores têm acesso.
        /// </summary>
        /// <param name="id">ID do usuário.</param>
        /// <returns>Confirmação de desativação.</returns>
        /// <response code="200">Usuário desativado com sucesso.</response>
        [HttpPatch("{id}/desativar")]
        [Authorize(Roles = "Admin")]
        [ProducesResponseType(typeof(ApiResponse<bool>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponse<bool>), StatusCodes.Status400BadRequest)]
        [ServiceFilter(typeof(AuditLogFilter))]
        [AuditLog("Desativar Usuário (Soft Delete)", "Usuario")]
        public async Task<IActionResult> Desactivar(int id)
        {
            var result = await _usuarioService.ToggleUserActiveStateAsync(id, active: false);
            if (!result.Success)
            {
                return BadRequest(result);
            }

            return Ok(result);
        }
    }
}
