using System.Threading.Tasks;
using GreenEnergy.API.Models.DTOs;

namespace GreenEnergy.API.Integrations
{
    public interface IViaCepClient
    {
        Task<ViaCepDTO?> ConsultarCepAsync(string cep);
    }
}
