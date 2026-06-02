namespace GreenEnergy.API.Models.Entities
{
    public enum UsuarioRole
    {
        Admin,
        Operador,
        Cliente
    }

    public enum TipoImovel
    {
        Casa,
        Apartamento,
        Comercial
    }

    public enum DispositivoStatus
    {
        Ativo,
        Suspenso,
        Defeito
    }

    public enum SensorStatus
    {
        Ativo,
        Suspenso,
        Defeito
    }

    public enum TipoMeta
    {
        KWh,
        Financeira
    }

    public enum MetaStatus
    {
        Proposta,
        Aprovada,
        Devolvida
    }

    public enum TipoChamado
    {
        Instalacao,
        Remocao,
        Manutencao
    }

    public enum ChamadoStatus
    {
        Pendente,
        EmAnalise,
        Validado
    }

    public enum TipoAlerta
    {
        Informativo,
        Alerta,
        Critico
    }

    public enum TipoOcorrencia
    {
        FalhaSensor,
        ExcessoConsumo,
        ManutencaoRecomendada
    }

    public enum BandeiraTarifa
    {
        Verde,
        Amarela,
        Vermelha1,
        Vermelha2
    }
}
