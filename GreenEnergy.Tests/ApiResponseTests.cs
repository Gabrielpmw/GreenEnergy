using System.Collections.Generic;
using GreenEnergy.API.Models.DTOs;
using Xunit;

namespace GreenEnergy.Tests
{
    public class ApiResponseTests
    {
        [Fact]
        public void ApiResponse_DefaultConstructor_ShouldInitializeAsSuccess()
        {
            // Act
            var response = new ApiResponse<string>();

            // Assert
            Assert.True(response.Success);
            Assert.Null(response.Data);
            Assert.Null(response.Message);
            Assert.Null(response.Errors);
        }

        [Fact]
        public void ApiResponse_SuccessConstructor_ShouldSetDataAndMessage()
        {
            // Arrange
            var testData = "GreenEnergyData";
            var testMessage = "Operação realizada com sucesso.";

            // Act
            var response = new ApiResponse<string>(testData, testMessage);

            // Assert
            Assert.True(response.Success);
            Assert.Equal(testData, response.Data);
            Assert.Equal(testMessage, response.Message);
            Assert.Null(response.Errors);
        }

        [Fact]
        public void ApiResponse_ErrorConstructor_ShouldSetSuccessFalseAndErrors()
        {
            // Arrange
            var errorMessage = "Falha de validação.";
            var errors = new List<string> { "O campo Email é obrigatório.", "O campo Senha é muito curto." };

            // Act
            var response = new ApiResponse<string>(errorMessage, errors);

            // Assert
            Assert.False(response.Success);
            Assert.Null(response.Data);
            Assert.Equal(errorMessage, response.Message);
            Assert.Equal(errors, response.Errors);
        }
    }
}
