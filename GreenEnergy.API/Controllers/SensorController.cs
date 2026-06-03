using System.Collections.Generic;
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
    [Route("api/v1/sensores")]
    [Produces("application/json")]
    [Authorize(Roles = "Admin,Operador")]
    public class SensorController : ControllerBase
    {
        private readonly ISensorService _sensorService;

        public SensorController(ISensorService sensorService)
        {
            _sensorService = sensorService;
        }

        /// <summary>
        /// Cadastra um novo sensor físico no estoque.
        /// </summary>
        [HttpPost]
        [ProducesResponseType(typeof(ApiResponse<SensorResponseDTO>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponse<SensorResponseDTO>), StatusCodes.Status400BadRequest)]
        [ServiceFilter(typeof(AuditLogFilter))]
        [AuditLog("Criar", "Sensor")]
        public async Task<IActionResult> Create([FromBody] CreateSensorRequestDTO dto)
        {
            var result = await _sensorService.CreateSensorAsync(dto);
            if (!result.Success)
            {
                return BadRequest(result);
            }
            return Ok(result);
        }

        /// <summary>
        /// Obtém os detalhes de um sensor do inventário pelo ID.
        /// </summary>
        [HttpGet("{id}")]
        [ProducesResponseType(typeof(ApiResponse<SensorResponseDTO>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponse<SensorResponseDTO>), StatusCodes.Status404NotFound)]
        public async Task<IActionResult> GetById(int id)
        {
            var result = await _sensorService.GetByIdAsync(id);
            if (!result.Success)
            {
                return NotFound(result);
            }
            return Ok(result);
        }

        /// <summary>
        /// Lista todos os sensores físicos cadastrados no estoque.
        /// </summary>
        [HttpGet]
        [ProducesResponseType(typeof(ApiResponse<IEnumerable<SensorResponseDTO>>), StatusCodes.Status200OK)]
        public async Task<IActionResult> GetAll()
        {
            var result = await _sensorService.ListAllAsync();
            return Ok(result);
        }

        /// <summary>
        /// Lista apenas os sensores físicos que estão livres e com status 'Disponivel' para nova vinculação.
        /// </summary>
        [HttpGet("disponiveis")]
        [ProducesResponseType(typeof(ApiResponse<IEnumerable<SensorResponseDTO>>), StatusCodes.Status200OK)]
        public async Task<IActionResult> GetAvailable()
        {
            var result = await _sensorService.ListAvailableAsync();
            return Ok(result);
        }

        /// <summary>
        /// Atualiza os dados básicos de cadastro de um sensor (Modelo/Número de Série).
        /// </summary>
        [HttpPut("{id}")]
        [ProducesResponseType(typeof(ApiResponse<SensorResponseDTO>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponse<SensorResponseDTO>), StatusCodes.Status400BadRequest)]
        [ProducesResponseType(typeof(ApiResponse<SensorResponseDTO>), StatusCodes.Status404NotFound)]
        [ServiceFilter(typeof(AuditLogFilter))]
        [AuditLog("Atualizar", "Sensor")]
        public async Task<IActionResult> Update(int id, [FromBody] UpdateSensorRequestDTO dto)
        {
            var result = await _sensorService.UpdateAsync(id, dto);
            if (!result.Success)
            {
                if (result.Message?.Contains("não encontrado") == true)
                {
                    return NotFound(result);
                }
                return BadRequest(result);
            }
            return Ok(result);
        }

        /// <summary>
        /// Altera o status operacional de um sensor físico (Ex: Devolver à manutenção ou marcar com defeito).
        /// </summary>
        [HttpPatch("{id}/status")]
        [ProducesResponseType(typeof(ApiResponse<SensorResponseDTO>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponse<SensorResponseDTO>), StatusCodes.Status404NotFound)]
        [ServiceFilter(typeof(AuditLogFilter))]
        [AuditLog("AtualizarStatus", "Sensor")]
        public async Task<IActionResult> UpdateStatus(int id, [FromQuery] SensorStatus status)
        {
            var result = await _sensorService.UpdateStatusAsync(id, status);
            if (!result.Success)
            {
                return NotFound(result);
            }
            return Ok(result);
        }

        /// <summary>
        /// Exclui/desativa logicamente um sensor físico do estoque.
        /// </summary>
        [HttpDelete("{id}")]
        [ProducesResponseType(typeof(ApiResponse<bool>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponse<bool>), StatusCodes.Status404NotFound)]
        [ServiceFilter(typeof(AuditLogFilter))]
        [AuditLog("Desativar", "Sensor")]
        public async Task<IActionResult> Delete(int id)
        {
            var result = await _sensorService.DesativarAsync(id);
            if (!result.Success)
            {
                return NotFound(result);
            }
            return Ok(result);
        }
    }
}
