using System.Collections.Generic;

namespace GreenEnergy.API.Models.DTOs
{
    public class ApiResponse<T>
    {
        public bool Success { get; set; }
        public T? Data { get; set; }
        public string? Message { get; set; }
        public IEnumerable<string>? Errors { get; set; }

        public ApiResponse()
        {
            Success = true;
        }

        public ApiResponse(T data, string? message = null)
        {
            Success = true;
            Data = data;
            Message = message;
        }

        public ApiResponse(string errorMessage, IEnumerable<string>? errors = null)
        {
            Success = false;
            Message = errorMessage;
            Errors = errors;
        }
    }
}
