using System.Collections.Generic;
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
    [Route("api/v1/configuracaoapi")]
    [Produces("application/json")]
    [Authorize(Roles = "Admin")]
    public class ConfiguracaoAPIController : ControllerBase
    {
        private readonly IConfiguracaoAPIService _configService;

        public ConfiguracaoAPIController(IConfiguracaoAPIService configService)
        {
            _configService = configService;
        }

        /// <summary>
        /// Lista todas as configurações de APIs cadastradas no sistema.
        /// </summary>
        /// <returns>Lista de configurações.</returns>
        [HttpGet]
        [ProducesResponseType(typeof(ApiResponse<IEnumerable<ConfiguracaoAPIResponseDTO>>), StatusCodes.Status200OK)]
        public async Task<IActionResult> GetAll()
        {
            var result = await _configService.ListAllAsync();
            return Ok(result);
        }

        /// <summary>
        /// Obtém uma configuração de API específica por ID.
        /// </summary>
        /// <param name="id">ID da configuração.</param>
        /// <returns>Configuração correspondente.</returns>
        [HttpGet("{id}")]
        [ProducesResponseType(typeof(ApiResponse<ConfiguracaoAPIResponseDTO>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponse<ConfiguracaoAPIResponseDTO>), StatusCodes.Status404NotFound)]
        public async Task<IActionResult> GetById(int id)
        {
            var result = await _configService.GetByIdAsync(id);
            if (!result.Success)
            {
                return NotFound(result);
            }
            return Ok(result);
        }

        /// <summary>
        /// Cadastra uma nova configuração de API.
        /// </summary>
        /// <param name="dto">Dados de configuração.</param>
        /// <returns>Configuração salva.</returns>
        [HttpPost]
        [ProducesResponseType(typeof(ApiResponse<ConfiguracaoAPIResponseDTO>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponse<ConfiguracaoAPIResponseDTO>), StatusCodes.Status400BadRequest)]
        [ServiceFilter(typeof(AuditLogFilter))]
        [AuditLog("Criar Configuração API", "ConfiguracaoAPI")]
        public async Task<IActionResult> Create([FromBody] CreateConfiguracaoAPIRequestDTO dto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(new ApiResponse<ConfiguracaoAPIResponseDTO>("Dados inválidos."));
            }

            var result = await _configService.CreateConfigAsync(dto);
            if (!result.Success)
            {
                return BadRequest(result);
            }

            return Ok(result);
        }

        /// <summary>
        /// Atualiza uma configuração de API existente (chave de acesso e URL).
        /// </summary>
        /// <param name="id">ID da configuração a ser atualizada.</param>
        /// <param name="dto">Novos valores da configuração.</param>
        /// <returns>Configuração atualizada.</returns>
        [HttpPut("{id}")]
        [ProducesResponseType(typeof(ApiResponse<ConfiguracaoAPIResponseDTO>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponse<ConfiguracaoAPIResponseDTO>), StatusCodes.Status400BadRequest)]
        [ServiceFilter(typeof(AuditLogFilter))]
        [AuditLog("Atualizar Configuração API", "ConfiguracaoAPI")]
        public async Task<IActionResult> Update(int id, [FromBody] UpdateConfiguracaoAPIRequestDTO dto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(new ApiResponse<ConfiguracaoAPIResponseDTO>("Dados inválidos."));
            }

            var result = await _configService.UpdateConfigAsync(id, dto);
            if (!result.Success)
            {
                return BadRequest(result);
            }

            return Ok(result);
        }

        /// <summary>
        /// Remove uma configuração de API.
        /// </summary>
        /// <param name="id">ID da configuração.</param>
        /// <returns>Status de sucesso.</returns>
        [HttpDelete("{id}")]
        [ProducesResponseType(typeof(ApiResponse<bool>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponse<bool>), StatusCodes.Status400BadRequest)]
        [ServiceFilter(typeof(AuditLogFilter))]
        [AuditLog("Remover Configuração API", "ConfiguracaoAPI")]
        public async Task<IActionResult> Delete(int id)
        {
            var result = await _configService.DeleteConfigAsync(id);
            if (!result.Success)
            {
                return BadRequest(result);
            }

            return Ok(result);
        }
    }
}
