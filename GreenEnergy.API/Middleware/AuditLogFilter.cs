using System;
using System.Linq;
using System.Security.Claims;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.Extensions.DependencyInjection;
using GreenEnergy.API.Models.Entities;
using GreenEnergy.API.Repositories;

namespace GreenEnergy.API.Middleware
{
    [AttributeUsage(AttributeTargets.Method)]
    public class AuditLogAttribute : Attribute
    {
        public string Acao { get; }
        public string Entidade { get; }

        public AuditLogAttribute(string acao, string entidade)
        {
            Acao = acao;
            Entidade = entidade;
        }
    }

    public class AuditLogFilter : IAsyncActionFilter
    {
        public async Task OnActionExecutionAsync(ActionExecutingContext context, ActionExecutionDelegate next)
        {
            var auditAttribute = context.ActionDescriptor.EndpointMetadata
                .OfType<AuditLogAttribute>()
                .FirstOrDefault();

            // Se não possuir o atributo de auditoria, apenas segue a execução
            if (auditAttribute == null)
            {
                await next();
                return;
            }

            var httpContext = context.HttpContext;
            var usuarioRepository = httpContext.RequestServices.GetRequiredService<IUsuarioRepository>();

            string? dadosAnteriores = null;
            string? entityIdStr = "0";

            // Se for uma operação de modificação (PUT/PATCH/DELETE), tentamos carregar o estado anterior
            if (context.HttpContext.Request.Method != HttpMethods.Post)
            {
                // Extrai o parâmetro "id" da rota
                if (context.RouteData.Values.TryGetValue("id", out var idVal) && idVal != null)
                {
                    entityIdStr = idVal.ToString();
                    if (int.TryParse(entityIdStr, out int entityId))
                    {
                        if (auditAttribute.Entidade.Equals("Usuario", StringComparison.InvariantCultureIgnoreCase))
                        {
                            var originalUser = await usuarioRepository.GetByIdAsync(entityId);
                            if (originalUser != null)
                            {
                                dadosAnteriores = JsonSerializer.Serialize(new
                                {
                                    originalUser.Id,
                                    originalUser.Nome,
                                    originalUser.Email,
                                    originalUser.Role,
                                    originalUser.IsActive,
                                    Perfil = originalUser.Perfil != null ? new
                                    {
                                        originalUser.Perfil.Telefone,
                                        originalUser.Perfil.Documento,
                                        originalUser.Perfil.AvatarUrl
                                    } : null
                                });
                            }
                        }
                        else if (auditAttribute.Entidade.Equals("UnidadeConsumidora", StringComparison.InvariantCultureIgnoreCase))
                        {
                            var unidadeRepository = httpContext.RequestServices.GetRequiredService<IUnidadeConsumidoraRepository>();
                            var originalUnidade = await unidadeRepository.GetByIdAsync(entityId);
                            if (originalUnidade != null)
                            {
                                dadosAnteriores = JsonSerializer.Serialize(new
                                {
                                    originalUnidade.Id,
                                    originalUnidade.UsuarioId,
                                    originalUnidade.TipoImovel,
                                    originalUnidade.CEP,
                                    originalUnidade.CodigoIBGE,
                                    originalUnidade.Cidade,
                                    originalUnidade.Estado,
                                    originalUnidade.IsActive
                                });
                            }
                        }
                        else if (auditAttribute.Entidade.Equals("Dispositivo", StringComparison.InvariantCultureIgnoreCase))
                        {
                            var dispositivoRepository = httpContext.RequestServices.GetRequiredService<IDispositivoRepository>();
                            var originalDispositivo = await dispositivoRepository.GetByIdAsync(entityId);
                            if (originalDispositivo != null)
                            {
                                dadosAnteriores = JsonSerializer.Serialize(new
                                {
                                    originalDispositivo.Id,
                                    originalDispositivo.UnidadeConsumidoraId,
                                    originalDispositivo.CategoriaId,
                                    originalDispositivo.Nome,
                                    originalDispositivo.TipoAparelho,
                                    originalDispositivo.Descricao,
                                    originalDispositivo.PotenciaWatts,
                                    originalDispositivo.Status,
                                    originalDispositivo.IsActive
                                });
                            }
                        }
                    }
                }
            }

            // Executa a action
            var executedContext = await next();

            // Se a action retornou um status de sucesso (2xx)
            if (executedContext.Result is ObjectResult objectResult && 
                objectResult.StatusCode >= 200 && objectResult.StatusCode < 300)
            {
                var auditLogRepository = httpContext.RequestServices.GetRequiredService<IAuditLogRepository>();

                // Identificar usuário logado
                int? usuarioLogadoId = null;
                var userIdClaim = httpContext.User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (!string.IsNullOrEmpty(userIdClaim) && int.TryParse(userIdClaim, out int parsedUserId))
                {
                    usuarioLogadoId = parsedUserId;
                }

                // Identificar IP
                string ipAddress = httpContext.Connection.RemoteIpAddress?.ToString() ?? "127.0.0.1";

                // Serializar os novos dados (payload enviado na requisição ou retornado)
                string dadosNovos = string.Empty;
                var requestBodyDto = context.ActionArguments.Values.FirstOrDefault();
                if (requestBodyDto != null)
                {
                    dadosNovos = JsonSerializer.Serialize(requestBodyDto);
                }
                else if (objectResult.Value != null)
                {
                    dadosNovos = JsonSerializer.Serialize(objectResult.Value);
                }

                // Se for um POST de criação de usuário, tentamos extrair o ID criado a partir do retorno da API
                if (context.HttpContext.Request.Method == HttpMethods.Post && objectResult.Value != null)
                {
                    try
                    {
                        // ApiResponse<T> -> Data -> Id
                        var valueType = objectResult.Value.GetType();
                        var dataProp = valueType.GetProperty("Data");
                        if (dataProp != null)
                        {
                            var dataVal = dataProp.GetValue(objectResult.Value);
                            if (dataVal != null)
                            {
                                var idProp = dataVal.GetType().GetProperty("Id");
                                if (idProp != null)
                                {
                                    entityIdStr = idProp.GetValue(dataVal)?.ToString() ?? "0";
                                }
                            }
                        }
                    }
                    catch
                    {
                        // Fallback silencioso se falhar a reflexão
                    }
                }

                // Salva o log de auditoria
                var auditLog = new AuditLog
                {
                    UsuarioId = usuarioLogadoId,
                    Acao = auditAttribute.Acao,
                    Entidade = auditAttribute.Entidade,
                    EntidadeId = entityIdStr ?? "0",
                    DadosAnteriores = dadosAnteriores,
                    DadosNovos = dadosNovos,
                    IP = ipAddress,
                    Timestamp = DateTime.UtcNow
                };

                await auditLogRepository.AddAsync(auditLog);
            }
        }
    }
}
