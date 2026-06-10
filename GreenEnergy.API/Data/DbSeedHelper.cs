using System;
using System.Collections.Generic;
using System.Linq;
using Microsoft.EntityFrameworkCore;
using GreenEnergy.API.Models.Entities;
using BCrypt.Net;

namespace GreenEnergy.API.Data
{
    public static class DbSeedHelper
    {
        private static string GerarEmailDeNome(string nomeCompleto)
        {
            var primeiroNome = nomeCompleto.Split(' ')[0].ToLower();
            
            // Remover acentuação comum em nomes brasileiros
            primeiroNome = primeiroNome
                .Replace("á", "a").Replace("à", "a").Replace("â", "a").Replace("ã", "a")
                .Replace("é", "e").Replace("è", "e").Replace("ê", "e")
                .Replace("í", "i").Replace("ì", "i").Replace("î", "i")
                .Replace("ó", "o").Replace("ò", "o").Replace("ô", "o").Replace("õ", "o")
                .Replace("ú", "u").Replace("ù", "u").Replace("û", "u")
                .Replace("ç", "c");

            return $"{primeiroNome}@gmail.com";
        }

        public static void SeedDatabase(ApplicationDbContext db)
        {
            // 1. Limpar registros existentes (exceto Admin, Categorias e Tarifas seeded pelo OnModelCreating)
            db.Telemetrias.ExecuteDelete();
            db.Alertas.ExecuteDelete();
            db.AnotacoesDispositivos.ExecuteDelete();
            db.Metas.ExecuteDelete();
            db.RelatoriosTecnicos.ExecuteDelete();
            db.Chamados.ExecuteDelete();
            db.Sensores.ExecuteDelete();
            db.Dispositivos.ExecuteDelete();
            db.Enderecos.ExecuteDelete();
            db.UnidadesConsumidoras.ExecuteDelete();
            db.Perfis.Where(p => p.UsuarioId != 1).ExecuteDelete();
            db.Usuarios.Where(u => u.Id != 1).ExecuteDelete();
            db.AuditLogs.ExecuteDelete();
            db.CachesDadosIBGE.ExecuteDelete();

            var random = new Random();

            // 5 CEPs reais com endereços do Tocantins (TO) para agrupamento de 5 em 5 usuários
            var ceps = new[] 
            {
                new { CEP = "77015002", Cidade = "Palmas", UF = "TO", Logradouro = "Avenida LO-01", Bairro = "Plano Diretor Norte", CodigoIBGE = "1721000" },
                new { CEP = "77818010", Cidade = "Araguaína", UF = "TO", Logradouro = "Rua Sete de Setembro", Bairro = "Setor Central", CodigoIBGE = "1702109" },
                new { CEP = "77700000", Cidade = "Guaraí", UF = "TO", Logradouro = "Avenida Bernardo Sayão", Bairro = "Setor Alvorada", CodigoIBGE = "1709302" },
                new { CEP = "77600000", Cidade = "Paraíso do Tocantins", UF = "TO", Logradouro = "Rua Bernardino Maciel", Bairro = "Setor Central", CodigoIBGE = "1716109" },
                new { CEP = "77020012", Cidade = "Palmas", UF = "TO", Logradouro = "Avenida NS-02", Bairro = "Plano Diretor Sul", CodigoIBGE = "1721000" }
            };

            // Hashes de senha padrão
            string clienteSenhaHash = BCrypt.Net.BCrypt.HashPassword("Pedro@123");
            string operadorSenhaHash = BCrypt.Net.BCrypt.HashPassword("Gabriel@123");

            // Nomes de Operadores
            var nomesOperadores = new[]
            {
                "Gabriel Medeiros",
                "Marcos Vinícius Barbosa",
                "Ana Júlia Rezende",
                "Ricardo Augusto Silveira",
                "Fabiana Costa Neves"
            };

            // Nomes de Clientes (25 no total)
            var nomesClientes = new[]
            {
                "Pedro Alvares", // 1. Pedro (login)
                "Mariana Silva Rocha",
                "Lucas Oliveira Souza",
                "Beatriz Souza Melo",
                "Thiago Costa Pinheiro",
                "Camila Santos Albuquerque",
                "Bruno Pereira Ramos",
                "Amanda Rodrigues Lacerda",
                "Felipe Almeida Nogueira",
                "Letícia Lima Fonseca",
                "Rafael Gomes Castro",
                "Larissa Martins Mendes",
                "Gustavo Rocha Figueiredo",
                "Juliana Dias Valente",
                "Rodrigo Castro Carvalho",
                "Fernanda Barbosa Couto",
                "Daniel Carvalho Moreira",
                "Patrícia Melo Antunes",
                "André Cardoso Prado",
                "Sofia Teixeira Dantas",
                "Leonardo Araujo Guimarães",
                "Vanessa Nascimento Cruz",
                "Eduardo Silva Freitas",
                "Gabriela Santos Pires",
                "Marcelo Ribeiro Faria"
            };

            // 2. Registrar 5 Operadores
            for (int i = 0; i < nomesOperadores.Length; i++)
            {
                string nome = nomesOperadores[i];
                string email = GerarEmailDeNome(nome);

                var op = new Usuario
                {
                    Nome = nome,
                    Email = email,
                    SenhaHash = operadorSenhaHash,
                    Role = UsuarioRole.Operador,
                    IsActive = true,
                    IsDeleted = false,
                    CriadoEm = DateTime.UtcNow
                };
                db.Usuarios.Add(op);
                db.SaveChanges();

                db.Perfis.Add(new Perfil
                {
                    UsuarioId = op.Id,
                    Telefone = $"(19) 99312-{(5000 + i)}",
                    Documento = $"222.222.222-2{i}",
                    IsActive = true,
                    IsDeleted = false
                });
            }

            // 3. Registrar 25 Clientes
            var clientes = new List<Usuario>();
            for (int i = 0; i < nomesClientes.Length; i++)
            {
                string nome = nomesClientes[i];
                string email = GerarEmailDeNome(nome);

                var cli = new Usuario
                {
                    Nome = nome,
                    Email = email,
                    SenhaHash = clienteSenhaHash,
                    Role = UsuarioRole.Cliente,
                    IsActive = true,
                    IsDeleted = false,
                    CriadoEm = DateTime.UtcNow
                };
                db.Usuarios.Add(cli);
                db.SaveChanges();

                db.Perfis.Add(new Perfil
                {
                    UsuarioId = cli.Id,
                    Telefone = $"(19) 98711-{(4000 + i)}",
                    Documento = $"333.333.333-{(10 + i)}",
                    IsActive = true,
                    IsDeleted = false
                });

                clientes.Add(cli);
            }

            // Dicionário de Aparelhos Realistas
            // Categoria ID 1: Climatização, ID 2: Linha Branca, ID 3: Eletrônicos
            var aparelhosRealistas = new Dictionary<int, (string Nome, string Tipo, int Watts)[]>
            {
                { 
                    1, new[] 
                    { 
                        ("Ar Condicionado LG Inverter 12000 BTU", "Ar Condicionado", 1085),
                        ("Aquecedor de Ambiente Cadence Solari", "Aquecedor Elétrico", 1500),
                        ("Ventilador de Teto Arno Ultimate", "Ventilador", 120),
                        ("Ar Condicionado Janela Consul 7500 BTU", "Ar Condicionado", 750),
                        ("Climatizador de Ar Ventisol Nobre", "Climatizador", 80)
                    } 
                },
                { 
                    2, new[] 
                    { 
                        ("Geladeira Frost Free Consul 340L", "Geladeira", 110),
                        ("Freezer Vertical Brastemp Flex", "Freezer", 150),
                        ("Micro-ondas Electrolux 20L", "Micro-ondas", 1150),
                        ("Lava Louças Brastemp 14 Serviços", "Lava Louças", 1500),
                        ("Máquina Lava e Seca Samsung 11kg", "Lava e Seca", 1200)
                    } 
                },
                { 
                    3, new[] 
                    { 
                        ("Computador Gamer Intel i7 + RTX 4060", "Computador", 450),
                        ("Televisor Smart 4K Samsung Crystal 55\"", "TV Smart", 150),
                        ("Console PlayStation 5 Slim", "Console Videogame", 200),
                        ("Roteador Wi-Fi 6 TP-Link Archer", "Roteador", 15)
                    } 
                }
            };

            // 4. Registrar Unidades Consumidoras, Endereços e Dispositivos
            for (int cIndex = 0; cIndex < clientes.Count; cIndex++)
            {
                var cliente = clientes[cIndex];
                
                // Distribuição de CEPs: a cada 5 clientes, usamos o mesmo CEP para agrupamento regional
                var cepInfo = ceps[cIndex / 5];

                // Determinístico por CEP/Cidade para obter contagens exatas
                int numUnidades = 2; // Palmas (cIndex 0..4 e 20..24) terá 10 * 2 = 20 unidades
                if (cIndex >= 5 && cIndex <= 9) // Araguaína (cIndex 5..9)
                {
                    // Queremos 12 unidades no total para 5 clientes: 3, 3, 2, 2, 2
                    numUnidades = (cIndex == 5 || cIndex == 6) ? 3 : 2;
                }
                else if (cIndex >= 10 && cIndex <= 14) // Guaraí
                {
                    // Queremos 5 unidades no total para 5 clientes: 1, 1, 1, 1, 1
                    numUnidades = 1;
                }
                else if (cIndex >= 15 && cIndex <= 19) // Paraíso do Tocantins
                {
                    // Queremos 8 unidades no total para 5 clientes: 2, 2, 2, 1, 1
                    numUnidades = (cIndex <= 17) ? 2 : 1;
                }
                for (int u = 1; u <= numUnidades; u++)
                {
                    var tipoImovel = (TipoImovel)random.Next(3);
                    string nomeUnidade = u == 1 ? "Residência Principal" : u == 2 ? "Casa de Campo" : "Ponto de Apoio";
                    if (tipoImovel == TipoImovel.Comercial)
                    {
                        nomeUnidade = u == 1 ? "Escritório Principal" : "Depósito/Filial";
                    }
                    else if (tipoImovel == TipoImovel.Apartamento)
                    {
                        nomeUnidade = u == 1 ? "Apartamento Centro" : "Apartamento Praia";
                    }

                    var unidade = new UnidadeConsumidora
                    {
                        Nome = nomeUnidade,
                        UsuarioId = cliente.Id,
                        TipoImovel = tipoImovel,
                        CEP = cepInfo.CEP,
                        Cidade = cepInfo.Cidade,
                        Estado = cepInfo.UF,
                        CodigoIBGE = cepInfo.CodigoIBGE,
                        IsActive = true,
                        IsDeleted = false
                    };
                    db.UnidadesConsumidoras.Add(unidade);
                    db.SaveChanges();

                    // Complemento realista de endereço
                    string complemento = u == 1 ? "Principal" : u == 2 ? $"Apto {random.Next(11, 98)}" : "Bloco B, Sala 4";

                    var endereco = new Endereco
                    {
                        UnidadeConsumidoraId = unidade.Id,
                        CEP = cepInfo.CEP,
                        Logradouro = cepInfo.Logradouro,
                        Numero = random.Next(10, 1500).ToString(),
                        Complemento = complemento,
                        Bairro = cepInfo.Bairro,
                        Cidade = cepInfo.Cidade,
                        UF = cepInfo.UF,
                        IsActive = true,
                        IsDeleted = false
                    };
                    db.Enderecos.Add(endereco);
                    db.SaveChanges();

                    // Cada unidade possui de 4 a 7 dispositivos
                    int numDispositivos = random.Next(4, 8);
                    for (int d = 1; d <= numDispositivos; d++)
                    {
                        // Seleção aleatória de categoria de aparelho
                        int catId = random.Next(1, 4);
                        var templates = aparelhosRealistas[catId];
                        var template = templates[random.Next(templates.Length)];

                        var dispositivo = new Dispositivo
                        {
                            UnidadeConsumidoraId = unidade.Id,
                            CategoriaId = catId,
                            Nome = template.Nome,
                            TipoAparelho = template.Tipo,
                            PotenciaWatts = template.Watts + random.Next(-20, 21), // Pequena variação para diferenciar equipamentos do mesmo tipo
                            Status = DispositivoStatus.Ativo,
                            IsActive = true,
                            IsDeleted = false,
                            CriadoEm = DateTime.UtcNow.AddDays(-random.Next(5, 45))
                        };
                        db.Dispositivos.Add(dispositivo);
                        db.SaveChanges();

                        // Registrar e vincular o sensor ao dispositivo
                        var sensor = new Sensor
                        {
                            DispositivoId = dispositivo.Id,
                            ModeloSensor = $"SNSR-{catId:D2}",
                            NumeroSerie = $"SN-{Guid.NewGuid().ToString().Substring(0, 8).ToUpper()}",
                            Status = SensorStatus.EmUso,
                            UltimoSinal = DateTime.UtcNow,
                            IsActive = true,
                            IsDeleted = false
                        };
                        db.Sensores.Add(sensor);
                        db.SaveChanges();
                    }
                }
            }

            db.SaveChanges();
        }
    }
}
