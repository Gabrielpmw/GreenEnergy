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
    [Route("api/v1/categorias")]
    [Produces("application/json")]
    [Authorize]
    public class CategoriaAparelhoController : ControllerBase
    {
        private readonly ICategoriaAparelhoService _categoriaService;

        public CategoriaAparelhoController(ICategoriaAparelhoService categoriaService)
        {
            _categoriaService = categoriaService;
        }

        /// <summary>
        /// Lista todas as categorias de aparelhos cadastradas.
        /// </summary>
        [HttpGet]
        [ProducesResponseType(typeof(ApiResponse<IEnumerable<CategoriaAparelhoResponseDTO>>), StatusCodes.Status200OK)]
        public async Task<IActionResult> GetAll()
        {
            var result = await _categoriaService.ListAllAsync();
            return Ok(result);
        }

        /// <summary>
        /// Obtém os detalhes de uma categoria pelo ID.
        /// </summary>
        [HttpGet("{id}")]
        [ProducesResponseType(typeof(ApiResponse<CategoriaAparelhoResponseDTO>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponse<CategoriaAparelhoResponseDTO>), StatusCodes.Status404NotFound)]
        public async Task<IActionResult> GetById(int id)
        {
            var result = await _categoriaService.GetByIdAsync(id);
            if (!result.Success)
            {
                return NotFound(result);
            }
            return Ok(result);
        }

        /// <summary>
        /// Cadastra uma nova categoria de aparelhos. Apenas Admin ou Operador.
        /// </summary>
        [HttpPost]
        [Authorize(Roles = "Admin,Operador")]
        [ProducesResponseType(typeof(ApiResponse<CategoriaAparelhoResponseDTO>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponse<CategoriaAparelhoResponseDTO>), StatusCodes.Status400BadRequest)]
        [ServiceFilter(typeof(AuditLogFilter))]
        [AuditLog("Criar", "CategoriaAparelho")]
        public async Task<IActionResult> Create([FromBody] CreateCategoriaAparelhoRequestDTO dto)
        {
            var result = await _categoriaService.CreateCategoriaAsync(dto);
            if (!result.Success)
            {
                return BadRequest(result);
            }
            return Ok(result);
        }

        /// <summary>
        /// Atualiza uma categoria de aparelho existente. Apenas Admin ou Operador.
        /// </summary>
        [HttpPut("{id}")]
        [Authorize(Roles = "Admin,Operador")]
        [ProducesResponseType(typeof(ApiResponse<CategoriaAparelhoResponseDTO>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponse<CategoriaAparelhoResponseDTO>), StatusCodes.Status400BadRequest)]
        [ProducesResponseType(typeof(ApiResponse<CategoriaAparelhoResponseDTO>), StatusCodes.Status404NotFound)]
        [ServiceFilter(typeof(AuditLogFilter))]
        [AuditLog("Atualizar", "CategoriaAparelho")]
        public async Task<IActionResult> Update(int id, [FromBody] CreateCategoriaAparelhoRequestDTO dto)
        {
            var result = await _categoriaService.UpdateAsync(id, dto);
            if (!result.Success)
            {
                if (result.Message?.Contains("não encontrada") == true)
                {
                    return NotFound(result);
                }
                return BadRequest(result);
            }
            return Ok(result);
        }

        /// <summary>
        /// Desativa (soft-delete) uma categoria de aparelhos. Apenas Admin ou Operador.
        /// </summary>
        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin,Operador")]
        [ProducesResponseType(typeof(ApiResponse<bool>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponse<bool>), StatusCodes.Status404NotFound)]
        [ServiceFilter(typeof(AuditLogFilter))]
        [AuditLog("Desativar", "CategoriaAparelho")]
        public async Task<IActionResult> Delete(int id)
        {
            var result = await _categoriaService.DesativarAsync(id);
            if (!result.Success)
            {
                return NotFound(result);
            }
            return Ok(result);
        }
    }
}
