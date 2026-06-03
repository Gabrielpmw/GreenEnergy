using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using GreenEnergy.API.Models.Entities;

namespace GreenEnergy.API.Data
{
    public class ApplicationDbContext : DbContext
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options)
        {
        }

        // 18 DbSets correspondentes às entidades
        public DbSet<Usuario> Usuarios { get; set; } = null!;
        public DbSet<Perfil> Perfis { get; set; } = null!;
        public DbSet<UnidadeConsumidora> UnidadesConsumidoras { get; set; } = null!;
        public DbSet<Endereco> Enderecos { get; set; } = null!;
        public DbSet<Dispositivo> Dispositivos { get; set; } = null!;
        public DbSet<CategoriaAparelho> CategoriasAparelhos { get; set; } = null!;
        public DbSet<Sensor> Sensores { get; set; } = null!;
        public DbSet<Telemetria> Telemetrias { get; set; } = null!;
        public DbSet<AnotacaoDispositivo> AnotacoesDispositivos { get; set; } = null!;
        public DbSet<Meta> Metas { get; set; } = null!;
        public DbSet<Chamado> Chamados { get; set; } = null!;
        public DbSet<Alerta> Alertas { get; set; } = null!;
        public DbSet<RelatorioTecnico> RelatoriosTecnicos { get; set; } = null!;
        public DbSet<AuditLog> AuditLogs { get; set; } = null!;
        public DbSet<Tarifa> Tarifas { get; set; } = null!;
        public DbSet<ConfiguracaoAPI> ConfiguracoesAPI { get; set; } = null!;
        public DbSet<CacheClima> CachesClima { get; set; } = null!;
        public DbSet<CacheDadosIBGE> CachesDadosIBGE { get; set; } = null!;

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Mapeamentos de chaves estrangeiras e relacionamentos fluent API

            // Relacionamento 1:1 Usuario <-> Perfil
            modelBuilder.Entity<Perfil>()
                .HasOne(p => p.Usuario)
                .WithOne(u => u.Perfil)
                .HasForeignKey<Perfil>(p => p.UsuarioId)
                .OnDelete(DeleteBehavior.Cascade);

            // Relacionamento 1:1 UnidadeConsumidora <-> Endereco
            modelBuilder.Entity<Endereco>()
                .HasOne(e => e.UnidadeConsumidora)
                .WithOne(u => u.Endereco)
                .HasForeignKey<Endereco>(e => e.UnidadeConsumidoraId)
                .OnDelete(DeleteBehavior.Cascade);

            // Relacionamento 1:1 Dispositivo <-> Sensor
            modelBuilder.Entity<Sensor>()
                .HasOne(s => s.Dispositivo)
                .WithOne(d => d.Sensor)
                .HasForeignKey<Sensor>(s => s.DispositivoId)
                .OnDelete(DeleteBehavior.SetNull);

            // Relacionamentos 1:N Usuario [Cliente] <-> UnidadeConsumidora
            modelBuilder.Entity<UnidadeConsumidora>()
                .HasOne(u => u.Usuario)
                .WithMany(usr => usr.UnidadesConsumidoras)
                .HasForeignKey(u => u.UsuarioId)
                .OnDelete(DeleteBehavior.Cascade);

            // Relacionamentos 1:N UnidadeConsumidora <-> Dispositivo
            modelBuilder.Entity<Dispositivo>()
                .HasOne(d => d.UnidadeConsumidora)
                .WithMany(u => u.Dispositivos)
                .HasForeignKey(d => d.UnidadeConsumidoraId)
                .OnDelete(DeleteBehavior.Cascade);

            // Relacionamentos 1:N CategoriaAparelho <-> Dispositivo
            modelBuilder.Entity<Dispositivo>()
                .HasOne(d => d.Categoria)
                .WithMany(c => c.Dispositivos)
                .HasForeignKey(d => d.CategoriaId)
                .OnDelete(DeleteBehavior.Restrict);

            // Relacionamentos 1:N Sensor <-> Telemetria
            modelBuilder.Entity<Telemetria>()
                .HasOne(t => t.Sensor)
                .WithMany(s => s.Telemetrias)
                .HasForeignKey(t => t.SensorId)
                .OnDelete(DeleteBehavior.Cascade);

            // Relacionamentos 1:N Dispositivo <-> AnotacaoDispositivo
            modelBuilder.Entity<AnotacaoDispositivo>()
                .HasOne(a => a.Dispositivo)
                .WithMany(d => d.Anotacoes)
                .HasForeignKey(a => a.DispositivoId)
                .OnDelete(DeleteBehavior.Cascade);

            // Relacionamentos 1:N Usuario [Cliente] <-> AnotacaoDispositivo
            modelBuilder.Entity<AnotacaoDispositivo>()
                .HasOne(a => a.Cliente)
                .WithMany()
                .HasForeignKey(a => a.ClienteId)
                .OnDelete(DeleteBehavior.Restrict);

            // Relacionamentos 1:N Dispositivo <-> Meta
            modelBuilder.Entity<Meta>()
                .HasOne(m => m.Dispositivo)
                .WithMany(d => d.Metas)
                .HasForeignKey(m => m.DispositivoId)
                .OnDelete(DeleteBehavior.Cascade);

            // Relacionamentos 1:N Usuario [Operador] <-> Meta
            modelBuilder.Entity<Meta>()
                .HasOne(m => m.Operador)
                .WithMany(u => u.MetasAvaliadas)
                .HasForeignKey(m => m.OperadorId)
                .OnDelete(DeleteBehavior.Restrict);

            // Relacionamentos 1:N Usuario [Cliente] <-> Chamado
            modelBuilder.Entity<Chamado>()
                .HasOne(c => c.Cliente)
                .WithMany(u => u.ChamadosCliente)
                .HasForeignKey(c => c.ClienteId)
                .OnDelete(DeleteBehavior.Restrict);

            // Relacionamentos 1:N Usuario [Operador] <-> Chamado
            modelBuilder.Entity<Chamado>()
                .HasOne(c => c.Operador)
                .WithMany(u => u.ChamadosOperador)
                .HasForeignKey(c => c.OperadorId)
                .OnDelete(DeleteBehavior.Restrict);

            // Relacionamentos 1:N Dispositivo <-> Chamado
            modelBuilder.Entity<Chamado>()
                .HasOne(c => c.Dispositivo)
                .WithMany(d => d.Chamados)
                .HasForeignKey(c => c.DispositivoId)
                .OnDelete(DeleteBehavior.Cascade);

            // Relacionamentos 1:N Chamado <-> RelatorioTecnico
            modelBuilder.Entity<RelatorioTecnico>()
                .HasOne(r => r.Chamado)
                .WithMany(c => c.RelatoriosTecnicos)
                .HasForeignKey(r => r.ChamadoId)
                .OnDelete(DeleteBehavior.Cascade);

            // Relacionamentos 1:N Usuario [Operador] <-> RelatorioTecnico
            modelBuilder.Entity<RelatorioTecnico>()
                .HasOne(r => r.Operador)
                .WithMany()
                .HasForeignKey(r => r.OperadorId)
                .OnDelete(DeleteBehavior.Restrict);

            // Relacionamentos 1:N Usuario <-> Alerta
            modelBuilder.Entity<Alerta>()
                .HasOne(a => a.Usuario)
                .WithMany(u => u.Alertas)
                .HasForeignKey(a => a.UsuarioId)
                .OnDelete(DeleteBehavior.Restrict);

            // Relacionamentos 1:N Dispositivo <-> Alerta
            modelBuilder.Entity<Alerta>()
                .HasOne(a => a.Dispositivo)
                .WithMany(d => d.Alertas)
                .HasForeignKey(a => a.DispositivoId)
                .OnDelete(DeleteBehavior.Restrict);

            // Relacionamentos 1:N Usuario <-> AuditLog
            modelBuilder.Entity<AuditLog>()
                .HasOne(a => a.Usuario)
                .WithMany(u => u.AuditLogs)
                .HasForeignKey(a => a.UsuarioId)
                .OnDelete(DeleteBehavior.SetNull);

            // Configurar o filtro de consulta global para Soft Delete em todas as entidades BaseEntity
            ConfigureSoftDeleteFilter(modelBuilder);

            // Seed inicial de dados
            SeedData(modelBuilder);
        }

        private void ConfigureSoftDeleteFilter(ModelBuilder modelBuilder)
        {
            foreach (var entityType in modelBuilder.Model.GetEntityTypes())
            {
                if (typeof(BaseEntity).IsAssignableFrom(entityType.ClrType))
                {
                    var method = typeof(ApplicationDbContext)
                        .GetMethod(nameof(SetGlobalQueryFilter), System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Instance)
                        ?.MakeGenericMethod(entityType.ClrType);
                    method?.Invoke(this, new object[] { modelBuilder });
                }
            }
        }

        private void SetGlobalQueryFilter<T>(ModelBuilder modelBuilder) where T : BaseEntity
        {
            modelBuilder.Entity<T>().HasQueryFilter(e => !e.IsDeleted && e.IsActive);
        }

        private void SeedData(ModelBuilder modelBuilder)
        {
            // 1. Seed do Usuario Administrador Padrão (Senha: Admin123!)
            // Gerado hash BCrypt estático para evitar recálculo em design-time ou dependência externa
            // SenhaHash gerado via BCrypt.Net.BCrypt.HashPassword("Admin123!"):
            string adminSenhaHash = "$2a$11$X7NajVOMby0KhlEqKxX73OZwgyitZql2gVqRenX7VCu03gjsq4lcm";

            modelBuilder.Entity<Usuario>().HasData(new Usuario
            {
                Id = 1,
                Nome = "Administrador Geral",
                Email = "admin@greenenergy.com",
                SenhaHash = adminSenhaHash,
                Role = UsuarioRole.Admin,
                CriadoEm = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc),
                IsActive = true,
                IsDeleted = false
            });

            modelBuilder.Entity<Perfil>().HasData(new Perfil
            {
                Id = 1,
                UsuarioId = 1,
                Telefone = "(00) 00000-0000",
                Documento = "000.000.000-00",
                AvatarUrl = null,
                IsActive = true,
                IsDeleted = false
            });

            // 2. Seed das Categorias de Aparelho Padrão
            modelBuilder.Entity<CategoriaAparelho>().HasData(
                new CategoriaAparelho
                {
                    Id = 1,
                    Nome = "Climatização",
                    Descricao = "Aparelhos de ar condicionado, ventiladores e aquecedores",
                    IconeUrl = "thermometer",
                    IsActive = true,
                    IsDeleted = false
                },
                new CategoriaAparelho
                {
                    Id = 2,
                    Nome = "Linha Branca",
                    Descricao = "Geladeiras, freezers, fornos e máquinas de lavar",
                    IconeUrl = "kitchen",
                    IsActive = true,
                    IsDeleted = false
                },
                new CategoriaAparelho
                {
                    Id = 3,
                    Nome = "Eletrônicos",
                    Descricao = "Computadores, televisores, consoles de videogame e roteadores",
                    IconeUrl = "tv",
                    IsActive = true,
                    IsDeleted = false
                }
            );

            // 3. Seed da Tarifa Inicial (Bandeira Verde)
            modelBuilder.Entity<Tarifa>().HasData(new Tarifa
            {
                Id = 1,
                Bandeira = BandeiraTarifa.Verde,
                ValorKWh = 0.65,
                VigenciaInicio = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc),
                IsActive = true,
                IsDeleted = false
            });
        }

        public override int SaveChanges()
        {
            ApplySoftDelete();
            return base.SaveChanges();
        }

        public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
        {
            ApplySoftDelete();
            return base.SaveChangesAsync(cancellationToken);
        }

        private void ApplySoftDelete()
        {
            foreach (var entry in ChangeTracker.Entries())
            {
                if (entry.Entity is BaseEntity entity)
                {
                    switch (entry.State)
                    {
                        case EntityState.Deleted:
                            entry.State = EntityState.Modified;
                            entity.IsDeleted = true;
                            entity.IsActive = false;
                            break;
                    }
                }
            }
        }
    }
}
