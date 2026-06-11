using System;
using System.Net.Http;
using System.Net.Http.Json;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using GreenEnergy.API.Models.DTOs;
using Microsoft.Extensions.Logging;

namespace GreenEnergy.API.Integrations
{
    public class ViaCepClient : IViaCepClient
    {
        private readonly HttpClient _httpClient;
        private readonly ILogger<ViaCepClient> _logger;

        public ViaCepClient(HttpClient httpClient, ILogger<ViaCepClient> logger)
        {
            _httpClient = httpClient;
            _logger = logger;
        }

        public async Task<ViaCepDTO?> ConsultarCepAsync(string cep)
        {
            if (string.IsNullOrWhiteSpace(cep))
            {
                return null;
            }

            var cepSanitizado = Regex.Replace(cep, @"[^\d]", "");

            if (cepSanitizado.Length != 8)
            {
                _logger.LogWarning("Tentativa de consulta com CEP inválido formatado: {Cep}", cep);
                return null;
            }

            try
            {
                var url = $"https://viacep.com.br/ws/{cepSanitizado}/json/";
                var response = await _httpClient.GetAsync(url);

                if (!response.IsSuccessStatusCode)
                {
                    _logger.LogError("Falha ao consultar CEP {Cep}. Status HTTP: {Status}", cepSanitizado, response.StatusCode);
                    return null;
                }

                var dados = await response.Content.ReadFromJsonAsync<ViaCepDTO>();

                if (dados == null || dados.Erro)
                {
                    _logger.LogWarning("CEP {Cep} não encontrado ou retornou erro da API ViaCEP.", cepSanitizado);
                    return null;
                }

                return dados;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro de comunicação ao consultar o CEP {Cep} na API ViaCEP.", cepSanitizado);
                throw; // Propaga para que o serviço identifique a indisponibilidade da API externa
            }
        }
    }
}
