using System;
using System.IO;
using System.Text;
using System.Text.Json.Serialization;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Builder;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi;
using GreenEnergy.API.Data;
using GreenEnergy.API.Middleware;
using GreenEnergy.API.Repositories;
using GreenEnergy.API.Services;
using GreenEnergy.API.Integrations;

var builder = WebApplication.CreateBuilder(args);

// 1. Configurar Serviços e Controladores
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        // Serializar Enums como String nos retornos JSON
        options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
    });

// 2. Configurar EF Core com SQL Server
builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

// Registrar Repositórios
builder.Services.AddScoped<IUsuarioRepository, UsuarioRepository>();
builder.Services.AddScoped<IAuditLogRepository, AuditLogRepository>();
builder.Services.AddScoped<IUnidadeConsumidoraRepository, UnidadeConsumidoraRepository>();
builder.Services.AddScoped<IDispositivoRepository, DispositivoRepository>();
builder.Services.AddScoped<IAnotacaoDispositivoRepository, AnotacaoDispositivoRepository>();
builder.Services.AddScoped<ICategoriaAparelhoRepository, CategoriaAparelhoRepository>();
builder.Services.AddScoped<IChamadoRepository, ChamadoRepository>();
builder.Services.AddScoped<ISensorRepository, SensorRepository>();
builder.Services.AddScoped<IMetaRepository, MetaRepository>();
builder.Services.AddScoped<IRelatorioTecnicoRepository, RelatorioTecnicoRepository>();

// Registrar Serviços
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IUsuarioService, UsuarioService>();
builder.Services.AddScoped<AuditLogFilter>();
builder.Services.AddScoped<IUnidadeConsumidoraService, UnidadeConsumidoraService>();
builder.Services.AddScoped<IDispositivoService, DispositivoService>();
builder.Services.AddScoped<ISensorService, SensorService>();
builder.Services.AddScoped<ICategoriaAparelhoService, CategoriaAparelhoService>();
builder.Services.AddScoped<IChamadoService, ChamadoService>();
builder.Services.AddScoped<IMetaService, MetaService>();
builder.Services.AddScoped<IRelatorioTecnicoService, RelatorioTecnicoService>();

// Registrar Integrações
builder.Services.AddHttpClient<IViaCepClient, ViaCepClient>();

// 3. Configurar Swagger/OpenAPI (tlc-spec-driven)
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "GreenEnergy API",
        Version = "v1",
        Description = "API do Sistema GreenEnergy - Gestão de Energia Sustentável"
    });

    // Configurar esquema de segurança do JWT no Swagger
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Description = "Autorização JWT. Insira 'Bearer' seguido de um espaço e o token JWT. Exemplo: 'Bearer eyJhbGciOi...'",
        Name = "Authorization",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.ApiKey,
        Scheme = "Bearer"
    });

    c.AddSecurityRequirement(document => new OpenApiSecurityRequirement
    {
        [new OpenApiSecuritySchemeReference("Bearer", document)] = new List<string>()
    });

    // Incluir Comentários XML no Swagger
    var xmlFile = $"{System.Reflection.Assembly.GetExecutingAssembly().GetName().Name}.xml";
    var xmlPath = Path.Combine(AppContext.BaseDirectory, xmlFile);
    if (File.Exists(xmlPath))
    {
        c.IncludeXmlComments(xmlPath);
    }
});

// 4. Configurar Autenticação JWT
var jwtSection = builder.Configuration.GetSection("Jwt");
var secretKey = jwtSection["Secret"] ?? "GreenEnergySuperSecretJwtKeyForAuthentication2026!";
var key = Encoding.ASCII.GetBytes(secretKey);

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.RequireHttpsMetadata = false;
    options.SaveToken = true;
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuerSigningKey = true,
        IssuerSigningKey = new SymmetricSecurityKey(key),
        ValidateIssuer = true,
        ValidIssuer = jwtSection["Issuer"] ?? "GreenEnergyAPI",
        ValidateAudience = true,
        ValidAudience = jwtSection["Audience"] ?? "GreenEnergyFrontend",
        ValidateLifetime = true,
        ClockSkew = TimeSpan.Zero
    };
});

// 5. Configurar CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("CorsPolicy", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

var app = builder.Build();

// Seeder Hook para CLI
if (args.Contains("--seed-db"))
{
    using (var scope = app.Services.CreateScope())
    {
        var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        Console.WriteLine("Limpando e populando o banco de dados com 25 clientes e 5 operadores...");
        GreenEnergy.API.Data.DbSeedHelper.SeedDatabase(db);
        Console.WriteLine("Banco de dados populado com sucesso!");
    }
    return;
}

// 6. Pipeline HTTP Middleware

// Middleware global de tratamento de exceções (tlc-spec-driven)
app.UseMiddleware<ExceptionHandlerMiddleware>();

// Habilitar Swagger em Desenvolvimento e Produção para facilidade de testes
app.UseSwagger();
app.UseSwaggerUI(c =>
{
    c.SwaggerEndpoint("/swagger/v1/swagger.json", "GreenEnergy API v1");
    c.RoutePrefix = "swagger";
});

app.UseHttpsRedirection();

app.UseCors("CorsPolicy");

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();
