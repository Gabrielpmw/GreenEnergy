using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using GreenEnergy.API.Models.DTOs;
using GreenEnergy.API.Models.Entities;
using GreenEnergy.API.Repositories;
using GreenEnergy.API.Integrations;

namespace GreenEnergy.API.Services
{
    public class UnidadeConsumidoraService : IUnidadeConsumidoraService
    {
        private readonly IUnidadeConsumidoraRepository _unidadeRepository;
        private readonly IViaCepClient _viaCepClient;

        public UnidadeConsumidoraService(IUnidadeConsumidoraRepository unidadeRepository, IViaCepClient viaCepClient)
        {
            _unidadeRepository = unidadeRepository;
            _viaCepClient = viaCepClient;
        }

        public async Task<ApiResponse<UnidadeConsumidoraResponseDTO>> CreateUnidadeConsumidoraAsync(CreateUnidadeConsumidoraRequestDTO dto, int usuarioId)
        {
            var cepSanitizado = Regex.Replace(dto.CEP, @"[^\d]", "");

            string logradouro = dto.Logradouro ?? string.Empty;
            string bairro = dto.Bairro ?? string.Empty;
            string cidade = dto.Cidade ?? string.Empty;
            string estado = dto.UF ?? string.Empty;
            string codigoIbge = string.Empty;

            try
            {
                var viaCepResult = await _viaCepClient.ConsultarCepAsync(cepSanitizado);
                if (viaCepResult != null)
                {
                    logradouro = viaCepResult.Logradouro;
                    bairro = viaCepResult.Bairro;
                    cidade = viaCepResult.Localidade;
                    estado = viaCepResult.Uf;
                    codigoIbge = viaCepResult.Ibge;
                }
                else
                {
                    return new ApiResponse<UnidadeConsumidoraResponseDTO>("O CEP informado não foi encontrado na base de dados do ViaCEP.");
                }
            }
            catch (Exception)
            {
                // ViaCEP API is offline/unavailable
                if (string.IsNullOrWhiteSpace(dto.Logradouro) || 
                    string.IsNullOrWhiteSpace(dto.Bairro) || 
                    string.IsNullOrWhiteSpace(dto.Cidade) || 
                    string.IsNullOrWhiteSpace(dto.UF))
                {
                    return new ApiResponse<UnidadeConsumidoraResponseDTO>("A API do ViaCEP está temporariamente fora do ar. Por favor, forneça os dados de endereço manualmente (Logradouro, Bairro, Cidade, UF) ou tente novamente mais tarde.");
                }
            }

            var unidade = new UnidadeConsumidora
            {
                Nome = dto.Nome,
                UsuarioId = usuarioId,
                TipoImovel = dto.TipoImovel,
                CEP = cepSanitizado,
                CodigoIBGE = codigoIbge,
                Cidade = cidade,
                Estado = estado,
                Endereco = new Endereco
                {
                    CEP = cepSanitizado,
                    Logradouro = logradouro,
                    Numero = dto.Numero,
                    Complemento = dto.Complemento,
                    Bairro = bairro,
                    Cidade = cidade,
                    UF = estado
                }
            };

            await _unidadeRepository.AddAsync(unidade);

            var responseDto = MapToResponse(unidade);
            return new ApiResponse<UnidadeConsumidoraResponseDTO>(responseDto, "Unidade Consumidora cadastrada com sucesso!");
        }

        public async Task<ApiResponse<UnidadeConsumidoraResponseDTO>> GetByIdAsync(int id, int requestUserId, string requestUserRole)
        {
            var unidade = await _unidadeRepository.GetByIdAsync(id);
            if (unidade == null)
            {
                return new ApiResponse<UnidadeConsumidoraResponseDTO>("Unidade Consumidora não encontrada.");
            }

            // Regra de autorização: Apenas o dono (UsuarioId), Operador ou Admin podem visualizar
            if (requestUserRole != "Admin" && requestUserRole != "Operador" && unidade.UsuarioId != requestUserId)
            {
                return new ApiResponse<UnidadeConsumidoraResponseDTO>("Acesso negado. Você não tem permissão para visualizar esta unidade.");
            }

            var dto = MapToResponse(unidade);
            return new ApiResponse<UnidadeConsumidoraResponseDTO>(dto);
        }

        public async Task<ApiResponse<IEnumerable<UnidadeConsumidoraResponseDTO>>> ListAllAsync(int requestUserId, string requestUserRole)
        {
            // Se for Cliente, lista apenas as próprias unidades
            if (requestUserRole == "Cliente")
            {
                var unidadesProprias = await _unidadeRepository.ListByUsuarioIdAsync(requestUserId);
                return new ApiResponse<IEnumerable<UnidadeConsumidoraResponseDTO>>(unidadesProprias.Select(MapToResponse));
            }

            var unidades = await _unidadeRepository.ListAllAsync();
            return new ApiResponse<IEnumerable<UnidadeConsumidoraResponseDTO>>(unidades.Select(MapToResponse));
        }

        public async Task<ApiResponse<IEnumerable<UnidadeConsumidoraResponseDTO>>> ListByClienteIdAsync(int clienteId, int requestUserId, string requestUserRole)
        {
            // Regra de autorização: Apenas o próprio cliente, Operador ou Admin podem listar
            if (requestUserRole != "Admin" && requestUserRole != "Operador" && clienteId != requestUserId)
            {
                return new ApiResponse<IEnumerable<UnidadeConsumidoraResponseDTO>>("Acesso negado. Permissão insuficiente.");
            }

            var unidades = await _unidadeRepository.ListByUsuarioIdAsync(clienteId);
            return new ApiResponse<IEnumerable<UnidadeConsumidoraResponseDTO>>(unidades.Select(MapToResponse));
        }

        public async Task<ApiResponse<UnidadeConsumidoraResponseDTO>> UpdateAsync(int id, CreateUnidadeConsumidoraRequestDTO dto, int requestUserId, string requestUserRole)
        {
            var unidade = await _unidadeRepository.GetByIdAsync(id);
            if (unidade == null)
            {
                return new ApiResponse<UnidadeConsumidoraResponseDTO>("Unidade Consumidora não encontrada.");
            }

            // Apenas o proprietário pode editar a unidade
            if (unidade.UsuarioId != requestUserId && requestUserRole != "Admin")
            {
                return new ApiResponse<UnidadeConsumidoraResponseDTO>("Acesso negado. Apenas o proprietário pode atualizar os dados desta unidade.");
            }

            var cepSanitizado = Regex.Replace(dto.CEP, @"[^\d]", "");

            string logradouro = dto.Logradouro ?? string.Empty;
            string bairro = dto.Bairro ?? string.Empty;
            string cidade = dto.Cidade ?? string.Empty;
            string estado = dto.UF ?? string.Empty;
            string codigoIbge = unidade.CodigoIBGE;

            // Se o CEP mudou, tentamos validar novamente
            if (unidade.CEP != cepSanitizado)
            {
                try
                {
                    var viaCepResult = await _viaCepClient.ConsultarCepAsync(cepSanitizado);
                    if (viaCepResult != null)
                    {
                        logradouro = viaCepResult.Logradouro;
                        bairro = viaCepResult.Bairro;
                        cidade = viaCepResult.Localidade;
                        estado = viaCepResult.Uf;
                        codigoIbge = viaCepResult.Ibge;
                    }
                    else
                    {
                        return new ApiResponse<UnidadeConsumidoraResponseDTO>("O CEP informado não foi encontrado na base de dados do ViaCEP.");
                    }
                }
                catch (Exception)
                {
                    // Fallback manual se a API estiver fora do ar
                    if (string.IsNullOrWhiteSpace(dto.Logradouro) || 
                        string.IsNullOrWhiteSpace(dto.Bairro) || 
                        string.IsNullOrWhiteSpace(dto.Cidade) || 
                        string.IsNullOrWhiteSpace(dto.UF))
                    {
                        return new ApiResponse<UnidadeConsumidoraResponseDTO>("A API do ViaCEP está temporariamente fora do ar. Por favor, forneça os dados de endereço manualmente para atualizar o CEP ou tente novamente mais tarde.");
                    }
                }
            }
            else
            {
                // Se o CEP é o mesmo, e ViaCEP estiver offline, mas o usuário enviou dados manuais atualizados, aceitamos
                if (!string.IsNullOrWhiteSpace(dto.Logradouro)) logradouro = dto.Logradouro;
                if (!string.IsNullOrWhiteSpace(dto.Bairro)) bairro = dto.Bairro;
                if (!string.IsNullOrWhiteSpace(dto.Cidade)) cidade = dto.Cidade;
                if (!string.IsNullOrWhiteSpace(dto.UF)) estado = dto.UF;
            }

            unidade.Nome = dto.Nome;
            unidade.TipoImovel = dto.TipoImovel;
            unidade.CEP = cepSanitizado;
            unidade.Cidade = cidade;
            unidade.Estado = estado;
            unidade.CodigoIBGE = codigoIbge;

            if (unidade.Endereco == null)
            {
                unidade.Endereco = new Endereco { UnidadeConsumidoraId = unidade.Id };
            }

            unidade.Endereco.CEP = cepSanitizado;
            unidade.Endereco.Logradouro = logradouro;
            unidade.Endereco.Numero = dto.Numero;
            unidade.Endereco.Complemento = dto.Complemento;
            unidade.Endereco.Bairro = bairro;
            unidade.Endereco.Cidade = cidade;
            unidade.Endereco.UF = estado;

            await _unidadeRepository.UpdateAsync(unidade);

            var responseDto = MapToResponse(unidade);
            return new ApiResponse<UnidadeConsumidoraResponseDTO>(responseDto, "Unidade Consumidora atualizada com sucesso!");
        }

        public async Task<ApiResponse<bool>> DesativarAsync(int id)
        {
            var unidade = await _unidadeRepository.GetByIdAsync(id);
            if (unidade == null)
            {
                return new ApiResponse<bool>("Unidade Consumidora não encontrada.");
            }

            unidade.IsActive = false;
            unidade.IsDeleted = true;

            await _unidadeRepository.UpdateAsync(unidade);
            return new ApiResponse<bool>(true, "Unidade Consumidora desativada com sucesso.");
        }

        private UnidadeConsumidoraResponseDTO MapToResponse(UnidadeConsumidora u)
        {
            return new UnidadeConsumidoraResponseDTO
            {
                Id = u.Id,
                Nome = u.Nome,
                UsuarioId = u.UsuarioId,
                TipoImovel = u.TipoImovel.ToString(),
                CEP = u.CEP,
                CodigoIBGE = u.CodigoIBGE,
                Cidade = u.Cidade,
                Estado = u.Estado,
                Endereco = u.Endereco != null ? new EnderecoResponseDTO
                {
                    CEP = u.Endereco.CEP,
                    Logradouro = u.Endereco.Logradouro,
                    Numero = u.Endereco.Numero,
                    Complemento = u.Endereco.Complemento,
                    Bairro = u.Endereco.Bairro,
                    Cidade = u.Endereco.Cidade,
                    UF = u.Endereco.UF
                } : new EnderecoResponseDTO()
            };
        }
    }
}
