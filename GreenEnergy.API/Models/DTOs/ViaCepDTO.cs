using System;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace GreenEnergy.API.Models.DTOs
{
    public class ViaCepDTO
    {
        [JsonPropertyName("cep")]
        public string Cep { get; set; } = string.Empty;

        [JsonPropertyName("logradouro")]
        public string Logradouro { get; set; } = string.Empty;

        [JsonPropertyName("complemento")]
        public string Complemento { get; set; } = string.Empty;

        [JsonPropertyName("bairro")]
        public string Bairro { get; set; } = string.Empty;

        [JsonPropertyName("localidade")]
        public string Localidade { get; set; } = string.Empty; // Cidade

        [JsonPropertyName("uf")]
        public string Uf { get; set; } = string.Empty;

        [JsonPropertyName("ibge")]
        public string Ibge { get; set; } = string.Empty;

        [JsonPropertyName("erro")]
        [JsonConverter(typeof(FlexibleBoolConverter))]
        public bool Erro { get; set; }
    }

    /// <summary>
    /// Custom converter to handle "erro": "true" or "erro": true from ViaCEP API
    /// </summary>
    public class FlexibleBoolConverter : JsonConverter<bool>
    {
        public override bool Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
        {
            if (reader.TokenType == JsonTokenType.True) return true;
            if (reader.TokenType == JsonTokenType.False) return false;
            if (reader.TokenType == JsonTokenType.String)
            {
                var value = reader.GetString();
                return bool.TryParse(value, out var result) && result;
            }
            return false;
        }

        public override void Write(Utf8JsonWriter writer, bool value, JsonSerializerOptions options)
        {
            writer.WriteBooleanValue(value);
        }
    }
}
