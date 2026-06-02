using System.Threading.Tasks;
using GreenEnergy.API.Models.Entities;

namespace GreenEnergy.API.Repositories
{
    public interface IAuditLogRepository
    {
        Task AddAsync(AuditLog log);
    }
}
