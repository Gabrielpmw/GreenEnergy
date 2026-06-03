using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using GreenEnergy.API.Models.DTOs;
using GreenEnergy.API.Models.Entities;
using GreenEnergy.API.Repositories;

namespace GreenEnergy.API.Services
{
    public class CategoriaAparelhoService : ICategoriaAparelhoService
    {
        private readonly ICategoriaAparelhoRepository _categoriaRepository;

        public CategoriaAparelhoService(ICategoriaAparelhoRepository categoriaRepository)
        {
            _categoriaRepository = categoriaRepository;
        }

        public async Task<ApiResponse<CategoriaAparelhoResponseDTO>> CreateCategoriaAsync(CreateCategoriaAparelhoRequestDTO dto)
        {
            var todos = await _categoriaRepository.ListAllAsync();
            if (todos.Any(c => c.Nome.Equals(dto.Nome, StringComparison.OrdinalIgnoreCase)))
            {
                return new ApiResponse<CategoriaAparelhoResponseDTO>("Uma categoria com este nome já existe.");
            }

            var categoria = new CategoriaAparelho
            {
                Nome = dto.Nome,
                Descricao = dto.Descricao,
                IconeUrl = dto.IconeUrl
            };

            await _categoriaRepository.AddAsync(categoria);

            var responseDto = MapToResponse(categoria);
            return new ApiResponse<CategoriaAparelhoResponseDTO>(responseDto, "Categoria de aparelho criada com sucesso!");
        }

        public async Task<ApiResponse<CategoriaAparelhoResponseDTO>> GetByIdAsync(int id)
        {
            var categoria = await _categoriaRepository.GetByIdAsync(id);
            if (categoria == null)
            {
                return new ApiResponse<CategoriaAparelhoResponseDTO>("Categoria de aparelho não encontrada.");
            }

            var dto = MapToResponse(categoria);
            return new ApiResponse<CategoriaAparelhoResponseDTO>(dto);
        }

        public async Task<ApiResponse<IEnumerable<CategoriaAparelhoResponseDTO>>> ListAllAsync()
        {
            var categorias = await _categoriaRepository.ListAllAsync();
            return new ApiResponse<IEnumerable<CategoriaAparelhoResponseDTO>>(categorias.Select(MapToResponse));
        }

        public async Task<ApiResponse<CategoriaAparelhoResponseDTO>> UpdateAsync(int id, CreateCategoriaAparelhoRequestDTO dto)
        {
            var categoria = await _categoriaRepository.GetByIdAsync(id);
            if (categoria == null)
            {
                return new ApiResponse<CategoriaAparelhoResponseDTO>("Categoria de aparelho não encontrada.");
            }

            if (!categoria.Nome.Equals(dto.Nome, StringComparison.OrdinalIgnoreCase))
            {
                var todos = await _categoriaRepository.ListAllAsync();
                if (todos.Any(c => c.Nome.Equals(dto.Nome, StringComparison.OrdinalIgnoreCase)))
                {
                    return new ApiResponse<CategoriaAparelhoResponseDTO>("Outra categoria com este nome já existe.");
                }
            }

            categoria.Nome = dto.Nome;
            categoria.Descricao = dto.Descricao;
            categoria.IconeUrl = dto.IconeUrl;

            await _categoriaRepository.UpdateAsync(categoria);

            var responseDto = MapToResponse(categoria);
            return new ApiResponse<CategoriaAparelhoResponseDTO>(responseDto, "Categoria de aparelho atualizada com sucesso!");
        }

        public async Task<ApiResponse<bool>> DesativarAsync(int id)
        {
            var categoria = await _categoriaRepository.GetByIdAsync(id);
            if (categoria == null)
            {
                return new ApiResponse<bool>("Categoria de aparelho não encontrada.");
            }

            categoria.IsActive = false;
            categoria.IsDeleted = true;

            await _categoriaRepository.UpdateAsync(categoria);
            return new ApiResponse<bool>(true, "Categoria de aparelho desativada com sucesso.");
        }

        private CategoriaAparelhoResponseDTO MapToResponse(CategoriaAparelho c)
        {
            return new CategoriaAparelhoResponseDTO
            {
                Id = c.Id,
                Nome = c.Nome,
                Descricao = c.Descricao,
                IconeUrl = c.IconeUrl
            };
        }
    }
}
