using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;
using Xunit;
using GreenEnergy.API.Models.DTOs;
using GreenEnergy.API.Models.Entities;
using GreenEnergy.API.Repositories;
using GreenEnergy.API.Services;

namespace GreenEnergy.Tests
{
    // FakeUsuarioRepository para testes unitários rápidos e determinísticos
    public class FakeUsuarioRepository : IUsuarioRepository
    {
        private readonly List<Usuario> _usuarios = new List<Usuario>();
        private int _idCounter = 1;

        public FakeUsuarioRepository()
        {
            // Seed base de teste
            var admin = new Usuario
            {
                Id = _idCounter++,
                Nome = "Administrador Geral",
                Email = "admin@greenenergy.com",
                SenhaHash = BCrypt.Net.BCrypt.HashPassword("AdminSecur3!"),
                Role = UsuarioRole.Admin,
                IsActive = true,
                IsDeleted = false,
                CriadoEm = DateTime.UtcNow
            };
            _usuarios.Add(admin);
        }

        public Task<Usuario?> GetByIdAsync(int id, bool includeDeleted = false)
        {
            var user = _usuarios.FirstOrDefault(u => u.Id == id);
            if (user != null && !includeDeleted && (user.IsDeleted || !user.IsActive))
            {
                return Task.FromResult<Usuario?>(null);
            }
            return Task.FromResult<Usuario?>(user);
        }

        public Task<Usuario?> GetByEmailAsync(string email)
        {
            var user = _usuarios.FirstOrDefault(u => u.Email.Equals(email, StringComparison.InvariantCultureIgnoreCase));
            if (user != null && (user.IsDeleted || !user.IsActive))
            {
                return Task.FromResult<Usuario?>(null);
            }
            return Task.FromResult<Usuario?>(user);
        }

        public Task<IEnumerable<Usuario>> ListAllAsync(UsuarioRole? role = null)
        {
            var query = _usuarios.Where(u => !u.IsDeleted && u.IsActive);
            if (role.HasValue)
            {
                query = query.Where(u => u.Role == role.Value);
            }
            return Task.FromResult<IEnumerable<Usuario>>(query.ToList());
        }

        public Task AddAsync(Usuario usuario)
        {
            usuario.Id = _idCounter++;
            _usuarios.Add(usuario);
            return Task.CompletedTask;
        }

        public Task UpdateAsync(Usuario usuario)
        {
            var index = _usuarios.FindIndex(u => u.Id == usuario.Id);
            if (index != -1)
            {
                _usuarios[index] = usuario;
            }
            return Task.CompletedTask;
        }

        public Task<bool> EmailExistsAsync(string email)
        {
            return Task.FromResult(_usuarios.Any(u => u.Email.Equals(email, StringComparison.InvariantCultureIgnoreCase)));
        }
    }

    public class AuthAndUserServicesTests
    {
        private readonly FakeUsuarioRepository _fakeRepository;
        private readonly IConfiguration _fakeConfiguration;
        private readonly AuthService _authService;
        private readonly UsuarioService _usuarioService;

        public AuthAndUserServicesTests()
        {
            _fakeRepository = new FakeUsuarioRepository();

            // Mock de Configurações
            var inMemorySettings = new Dictionary<string, string> {
                {"Jwt:Secret", "SuperSecretGreenEnergyJwtKeyForTestsValidation2026!"},
                {"Jwt:Issuer", "GreenEnergyAPI"},
                {"Jwt:Audience", "GreenEnergyFrontend"},
                {"Jwt:ExpiryMinutes", "60"}
            };
            _fakeConfiguration = new ConfigurationBuilder()
                .AddInMemoryCollection(inMemorySettings!)
                .Build();

            _authService = new AuthService(_fakeRepository, _fakeConfiguration);
            _usuarioService = new UsuarioService(_fakeRepository);
        }

        [Fact]
        public async Task RegisterClientAsync_ValidData_ShouldCreateClientSuccessfully()
        {
            // Arrange
            var dto = new RegisterRequestDTO
            {
                Nome = "Gabriel Cliente",
                Email = "gabriel.cliente@gmail.com",
                Senha = "Password123!",
                Telefone = "(11) 98888-8888",
                Documento = "444.444.444-44"
            };

            // Act
            var result = await _authService.RegisterClientAsync(dto);

            // Assert
            Assert.True(result.Success);
            Assert.NotNull(result.Data);
            Assert.Equal("Cliente cadastrado com sucesso!", result.Message);
            Assert.Equal("gabriel.cliente@gmail.com", result.Data.Email);
            Assert.Equal("Cliente", result.Data.Role);
        }

        [Fact]
        public async Task RegisterClientAsync_DuplicateEmail_ShouldReturnError()
        {
            // Arrange
            var dto = new RegisterRequestDTO
            {
                Nome = "Gabriel Clone",
                Email = "admin@greenenergy.com", // Já existe no seed do fake
                Senha = "Password123!",
                Telefone = "(11) 98888-8888",
                Documento = "444.444.444-44"
            };

            // Act
            var result = await _authService.RegisterClientAsync(dto);

            // Assert
            Assert.False(result.Success);
            Assert.Null(result.Data);
            Assert.Equal("O e-mail informado já está cadastrado.", result.Message);
        }

        [Fact]
        public async Task LoginAsync_ValidCredentials_ShouldReturnJwtAndRefreshToken()
        {
            // Arrange
            var loginDto = new LoginRequestDTO
            {
                Email = "admin@greenenergy.com",
                Senha = "AdminSecur3!"
            };

            // Act
            var result = await _authService.LoginAsync(loginDto);

            // Assert
            Assert.True(result.Success);
            Assert.NotNull(result.Data);
            Assert.NotEmpty(result.Data.Token);
            Assert.NotEmpty(result.Data.RefreshToken);
            Assert.Equal("Admin", result.Data.Role);
        }

        [Fact]
        public async Task LoginAsync_InvalidCredentials_ShouldReturnErrorMessage()
        {
            // Arrange
            var loginDto = new LoginRequestDTO
            {
                Email = "admin@greenenergy.com",
                Senha = "SenhaErrada!"
            };

            // Act
            var result = await _authService.LoginAsync(loginDto);

            // Assert
            Assert.False(result.Success);
            Assert.Null(result.Data);
            Assert.Equal("E-mail ou senha incorretos.", result.Message);
        }

        [Fact]
        public async Task UpdateOwnProfileAsync_WithPasswordAndEmailChange_ShouldUpdateSuccessfully()
        {
            // Arrange
            // 1. Cadastrar um cliente primeiro
            var registerDto = new RegisterRequestDTO
            {
                Nome = "Cliente Original",
                Email = "cliente.original@gmail.com",
                Senha = "Password123!",
                Telefone = "(11) 98888-8888",
                Documento = "444.444.444-44"
            };
            var registerResult = await _authService.RegisterClientAsync(registerDto);
            var userId = registerResult.Data!.Id;

            // 2. Atualizar perfil com novo email e nova senha
            var userDto = new UpdateUsuarioRequestDTO
            {
                Nome = "Cliente Atualizado",
                Email = "cliente.atualizado@gmail.com",
                Senha = "NewPassword123!"
            };
            var profileDto = new UpdatePerfilRequestDTO
            {
                Telefone = "(11) 97777-7777",
                Documento = "555.555.555-55",
                AvatarUrl = "http://avatar.url/gabriel"
            };

            // Act
            var result = await _usuarioService.UpdateOwnProfileAsync(userId, userDto, profileDto);

            // Assert
            Assert.True(result.Success);
            Assert.NotNull(result.Data);
            Assert.Equal("Seu perfil foi atualizado com sucesso!", result.Message);
            Assert.Equal("cliente.atualizado@gmail.com", result.Data.Email);
            Assert.Equal("Cliente Atualizado", result.Data.Nome);

            // 3. Verificar login com a nova senha para garantir que o hash funcionou
            var loginDto = new LoginRequestDTO
            {
                Email = "cliente.atualizado@gmail.com",
                Senha = "NewPassword123!"
            };
            var loginResult = await _authService.LoginAsync(loginDto);
            Assert.True(loginResult.Success);
        }

        [Fact]
        public async Task ToggleUserActiveStateAsync_Desativar_ShouldSoftDeleteSuccessfully()
        {
            // Arrange
            var registerDto = new RegisterRequestDTO
            {
                Nome = "Cliente Para Deletar",
                Email = "deletar.cliente@gmail.com",
                Senha = "Password123!",
                Telefone = "(11) 98888-8888",
                Documento = "444.444.444-44"
            };
            var registerResult = await _authService.RegisterClientAsync(registerDto);
            var userId = registerResult.Data!.Id;

            // Act - Desativar
            var desativarResult = await _usuarioService.ToggleUserActiveStateAsync(userId, active: false);

            // Assert
            Assert.True(desativarResult.Success);
            Assert.True(desativarResult.Data);
            Assert.Equal("Usuário desativado (soft delete) com sucesso!", desativarResult.Message);

            // Tentar obter usuário desativado (deve retornar null devido ao soft delete filter conceitual do fake)
            var queryUser = await _fakeRepository.GetByIdAsync(userId);
            Assert.Null(queryUser);

            // Act - Reativar
            var reativarResult = await _usuarioService.ToggleUserActiveStateAsync(userId, active: true);

            // Assert
            Assert.True(reativarResult.Success);
            Assert.True(reativarResult.Data);
            Assert.Equal("Usuário ativado com sucesso!", reativarResult.Message);

            // Tentar obter reativado
            var queryUserActive = await _fakeRepository.GetByIdAsync(userId);
            Assert.NotNull(queryUserActive);
            Assert.True(queryUserActive.IsActive);
            Assert.False(queryUserActive.IsDeleted);
        }
    }
}
