using MediatR;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using _10xdevs.Application.DTOs.Statistics;
using _10xdevs.Application.Extensions;
using _10xdevs.Domain.Interfaces;

namespace _10xdevs.Application.Queries.Statistics.GetGenerationAcceptance;

public class GetGenerationAcceptanceQueryHandler : IRequestHandler<GetGenerationAcceptanceQuery, GenerationAcceptanceResponseDto>
{
    private readonly IFlashcardGenerationEventRepository _repository;
    private readonly ILogger<GetGenerationAcceptanceQueryHandler> _logger;
    private readonly StatisticsOptions _options;

    public GetGenerationAcceptanceQueryHandler(
        IFlashcardGenerationEventRepository repository,
        ILogger<GetGenerationAcceptanceQueryHandler> logger,
        IOptions<StatisticsOptions> options)
    {
        _repository = repository;
        _logger = logger;
        _options = options.Value;
    }

    public async Task<GenerationAcceptanceResponseDto> Handle(
        GetGenerationAcceptanceQuery request,
        CancellationToken cancellationToken)
    {
        try
        {
            var stats = await _repository.GetGlobalStatisticsAsync(cancellationToken);

            if (stats.TotalCandidates == 0)
            {
                return new GenerationAcceptanceResponseDto
                {
                    TotalCandidates = 0,
                    AcceptedWithoutEditing = 0,
                    AcceptedAfterEditing = 0,
                    Rejected = 0,
                    AcceptanceRate = 0.0m,
                    PureAcceptanceRate = 0.0m,
                    MeetsSuccessMetric = false,
                    TargetRate = _options.GenerationAcceptanceTargetRate
                };
            }

            var rejected = stats.TotalCandidates - stats.AcceptedCount - stats.EditedCount;
            var acceptanceRate = (decimal)(stats.AcceptedCount + stats.EditedCount) / stats.TotalCandidates;
            var pureAcceptanceRate = (decimal)stats.AcceptedCount / stats.TotalCandidates;

            return new GenerationAcceptanceResponseDto
            {
                TotalCandidates = stats.TotalCandidates,
                AcceptedWithoutEditing = stats.AcceptedCount,
                AcceptedAfterEditing = stats.EditedCount,
                Rejected = rejected,
                AcceptanceRate = Math.Round(acceptanceRate, 3),
                PureAcceptanceRate = Math.Round(pureAcceptanceRate, 3),
                MeetsSuccessMetric = pureAcceptanceRate >= _options.GenerationAcceptanceTargetRate,
                TargetRate = _options.GenerationAcceptanceTargetRate
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving generation acceptance statistics");
            throw;
        }
    }
}
