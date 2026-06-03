using Microsoft.EntityFrameworkCore;
using GreenEnergy.API.Data;
using GreenEnergy.Worker.Workers;

var builder = Host.CreateApplicationBuilder(args);

// Registrar DbContext apontando para o banco compartilhado
builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

// Suporte a requisições HTTP para as integrações de API
builder.Services.AddHttpClient();

// Registrar os background services da Fase 4
builder.Services.AddHostedService<TelemetriaWorker>();
builder.Services.AddHostedService<AlertaWorker>();
builder.Services.AddHostedService<CacheApiWorker>();

var host = builder.Build();
host.Run();
