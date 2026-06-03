using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using GreenEnergy.API.Models.DTOs;
using GreenEnergy.API.Services;

namespace GreenEnergy.API.Controllers
{
    [ApiController]
    [Route("api/v1/auditoria")]
    [Produces("application/json")]
    [Authorize(Roles = "Admin")]
    public class AuditLogController : ControllerBase
    {
        private readonly IAuditLogService _auditLogService;

        public AuditLogController(IAuditLogService auditLogService)
        {
            _auditLogService = auditLogService;
        }

        /// <summary>
        /// Lista e filtra todos os logs de auditoria do sistema. Disponível apenas para Administradores.
        /// </summary>
        /// <param name="usuarioRole">Filtrar logs por perfil do executor (Admin, Operador, Cliente).</param>
        /// <param name="startDate">Data inicial do período pesquisado.</param>
        /// <param name="endDate">Data final do período pesquisado.</param>
        /// <param name="acao">Filtrar pelo nome da ação realizada (ex: "Criar Operador").</param>
        /// <param name="entidade">Filtrar por nome de entidade modificada (ex: "Usuario").</param>
        /// <returns>Lista filtrada de logs de auditoria.</returns>
        [HttpGet]
        [ProducesResponseType(typeof(ApiResponse<IEnumerable<AuditLogResponseDTO>>), StatusCodes.Status200OK)]
        public async Task<IActionResult> GetFiltered(
            [FromQuery] string? usuarioRole,
            [FromQuery] DateTime? startDate,
            [FromQuery] DateTime? endDate,
            [FromQuery] string? acao,
            [FromQuery] string? entidade)
        {
            var result = await _auditLogService.ListFilteredAsync(usuarioRole, startDate, endDate, acao, entidade);
            return Ok(result);
        }
    }
}
