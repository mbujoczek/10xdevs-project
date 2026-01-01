using _10xdevs.Application.DTOs.Flashcards;
using _10xdevs.Domain.Entities;
using AutoMapper;

namespace _10xdevs.Application.Mappings;

public class FlashcardMappingProfile : Profile
{
    public FlashcardMappingProfile()
    {
        CreateMap<Flashcard, FlashcardDto>();
    }
}
