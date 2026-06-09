using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using GreenEnergy.API.Data;
using GreenEnergy.API.Middleware;
using GreenEnergy.API.Models.DTOs;
using GreenEnergy.API.Models.Entities;

namespace GreenEnergy.API.Controllers
{
    [ApiController]
    [Route("api/v1/alertas")]
    [Produces("application/json")]
    [Authorize]
    public class AlertasController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public AlertasController(ApplicationDbContext context)
        {
            _context = context;
        }

        /// <summary>
        /// Obtém todos os alertas/notificações do usuário autenticado.
        /// </summary>
        [HttpGet]
        [ProducesResponseType(typeof(ApiResponse<IEnumerable<AlertaResponseDTO>>), StatusCodes.Status200OK)]
        public async Task<IActionResult> GetMeusAlertas()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out int loggedInUserId))
            {
                return Unauthorized();
            }

            var alertas = await _context.Alertas
                .Include(a => a.Dispositivo)
                .Where(a => a.UsuarioId == loggedInUserId)
                .OrderByDescending(a => a.GeradoEm)
                .ToListAsync();

            var response = alertas.Select(a => new AlertaResponseDTO
            {
                Id = a.Id,
                UsuarioId = a.UsuarioId,
                DispositivoId = a.DispositivoId,
                DispositivoNome = a.Dispositivo?.Nome,
                Mensagem = a.Mensagem,
                Tipo = a.Tipo.ToString(),
                Lido = a.Lido,
                GeradoEm = a.GeradoEm
            });

            return Ok(new ApiResponse<IEnumerable<AlertaResponseDTO>>(response, "Alertas obtidos com sucesso!"));
        }

        /// <summary>
        /// Marca um alerta específico como lido.
        /// </summary>
        [HttpPatch("{id}/lido")]
        [ProducesResponseType(typeof(ApiResponse<bool>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponse<bool>), StatusCodes.Status404NotFound)]
        public async Task<IActionResult> MarcarComoLido(int id)
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out int loggedInUserId))
            {
                return Unauthorized();
            }

            var alerta = await _context.Alertas.FirstOrDefaultAsync(a => a.Id == id && a.UsuarioId == loggedInUserId);
            if (alerta == null)
            {
                return NotFound(new ApiResponse<bool>("Alerta não encontrado ou não pertence a este usuário."));
            }

            alerta.Lido = true;
            _context.Alertas.Update(alerta);
            await _context.SaveChangesAsync();

            return Ok(new ApiResponse<bool>(true, "Alerta marcado como lido."));
        }

        /// <summary>
        /// Marca todos os alertas do usuário autenticado como lidos.
        /// </summary>
        [HttpPost("marcar-lidos")]
        [ProducesResponseType(typeof(ApiResponse<bool>), StatusCodes.Status200OK)]
        public async Task<IActionResult> MarcarTodosComoLidos()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out int loggedInUserId))
            {
                return Unauthorized();
            }

            var alertasNaoLidos = await _context.Alertas
                .Where(a => a.UsuarioId == loggedInUserId && !a.Lido)
                .ToListAsync();

            foreach (var alerta in alertasNaoLidos)
            {
                alerta.Lido = true;
            }

            _context.Alertas.UpdateRange(alertasNaoLidos);
            await _context.SaveChangesAsync();

            return Ok(new ApiResponse<bool>(true, "Todos os alertas foram marcados como lidos."));
        }
    }
}
