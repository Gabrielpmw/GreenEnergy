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
    [Route("api/v1/dashboard/admin")]
    [Produces("application/json")]
    [Authorize(Roles = "Admin")]
    public class AdminDashboardController : ControllerBase
    {
        private readonly IAdminDashboardService _dashboardService;
        private readonly IIbgeService _ibgeService;

        public AdminDashboardController(IAdminDashboardService dashboardService, IIbgeService ibgeService)
        {
            _dashboardService = dashboardService;
            _ibgeService = ibgeService;
        }

        /// <summary>
        /// Retorna os principais indicadores do ecossistema do sistema (Cockpit do Administrador).
        /// Inclui volume de telemetria, sensores ativos/inativos, saúde do Worker Service e status das APIs.
        /// </summary>
        /// <returns>Indicadores agregados do ecossistema.</returns>
        [HttpGet]
        [ProducesResponseType(typeof(ApiResponse<AdminDashboardResponseDTO>), StatusCodes.Status200OK)]
        public async Task<IActionResult> GetDashboardMetrics()
        {
            var result = await _dashboardService.GetDashboardMetricsAsync();
            return Ok(result);
        }

        /// <summary>
        /// Obtém dados demográficos e taxa de adesão de mercado por município (Apenas Admin).
        /// </summary>
        /// <returns>Dados demográficos por município.</returns>
        [HttpGet("mercado-ibge")]
        [ProducesResponseType(typeof(ApiResponse<IEnumerable<MercadoCidadeResponseDTO>>), StatusCodes.Status200OK)]
        public async Task<IActionResult> GetMercadoIbge()
        {
            var result = await _ibgeService.ObterDadosMercadoAdminAsync();
            return Ok(result);
        }
    }
}
