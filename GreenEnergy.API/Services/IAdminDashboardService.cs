using System.Threading.Tasks;
using GreenEnergy.API.Models.DTOs;

namespace GreenEnergy.API.Services
{
    public interface IAdminDashboardService
    {
        Task<ApiResponse<AdminDashboardResponseDTO>> GetDashboardMetricsAsync();
    }
}
