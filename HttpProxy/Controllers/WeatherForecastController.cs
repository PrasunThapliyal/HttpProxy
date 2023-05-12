using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Text;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR.Client;
using Microsoft.Extensions.Logging;

namespace HttpProxy.Controllers
{
    [ApiController]
    [Route("[controller]")]
    public class WeatherForecastController : ControllerBase
    {
        private static readonly string[] Summaries = new[]
        {
            "Freezing", "Bracing", "Chilly", "Cool", "Mild", "Warm", "Balmy", "Hot", "Sweltering", "Scorching"
        };

        private readonly ILogger<WeatherForecastController> _logger;

        public WeatherForecastController(ILogger<WeatherForecastController> logger)
        {
            _logger = logger;
        }

        [HttpGet("connect")]
        public async Task<IActionResult> Connect()
        {
            var connection = new HubConnectionBuilder()
                .WithUrl(
                "http://localhost:44365/WebSocketsService/chats?networkDesignId=abc&clientId=def", 
                options =>
                {
                    //var cookie = new Cookie
                    //{
                        
                    //}
                    //options.Cookies.Add("uac.authorization", "something")
                    //options.Headers.Add()
                }
                )
                .Build();

            
            await connection.StartAsync();

            return Ok();
        }

        [HttpGet]
        public async Task<IEnumerable<WeatherForecast>> Get()
        {
            {
                using (var client = new HttpClient())
                {
                    client.BaseAddress = new Uri("https://sup3mig2.test.apps.ciena.com/tron/");
                    client.DefaultRequestHeaders.Accept.Clear();
                    client.DefaultRequestHeaders.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));

                    var content = new StringContent("{ \"username\":\"admin\",\"password\":\"adminpw\"}", Encoding.UTF8, "application/json");
                    var requestUri = "api/v1/tokens";
                    var response = await client.PostAsync(requestUri, content).ConfigureAwait(false);
                    if (response.IsSuccessStatusCode)
                    {
                        var r = await response.Content.ReadAsStringAsync().ConfigureAwait(false);
                        _logger.LogInformation(r);
                    }
                    else
                    {
                        var r = await response.Content.ReadAsStringAsync().ConfigureAwait(false);
                        _logger.LogWarning($"Tron API Failed. {response}");
                    }
                }
            }
            {
                using (var client = new HttpClient())
                {
                    client.BaseAddress = new Uri("http://sup3mig2.test.apps.ciena.com/tron/");
                    client.DefaultRequestHeaders.Accept.Clear();
                    client.DefaultRequestHeaders.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));

                    var content = new StringContent("{ \"username\":\"admin\",\"password\":\"adminpw\"}", Encoding.UTF8, "application/json");
                    var requestUri = "api/v1/tokens";
                    var response = await client.PostAsync(requestUri, content).ConfigureAwait(false);
                    if (response.IsSuccessStatusCode)
                    {
                        var r = await response.Content.ReadAsStringAsync().ConfigureAwait(false);
                        _logger.LogInformation(r);
                    }
                    else
                    {
                        var r = await response.Content.ReadAsStringAsync().ConfigureAwait(false);
                        _logger.LogWarning($"Tron API Failed. {response}");
                    }
                }
            }
            {
                using (var client = new HttpClient())
                {
                    client.BaseAddress = new Uri("https://rexton.test.apps.ciena.com/tron/");
                    client.DefaultRequestHeaders.Accept.Clear();
                    client.DefaultRequestHeaders.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));

                    var content = new StringContent("{ \"username\":\"admin\",\"password\":\"adminpw\"}", Encoding.UTF8, "application/json");
                    var requestUri = "api/v1/tokens";
                    var response = await client.PostAsync(requestUri, content).ConfigureAwait(false);
                    if (response.IsSuccessStatusCode)
                    {
                        var r = await response.Content.ReadAsStringAsync().ConfigureAwait(false);
                        _logger.LogInformation(r);
                    }
                    else
                    {
                        var r = await response.Content.ReadAsStringAsync().ConfigureAwait(false);
                        _logger.LogWarning($"Tron API Failed. {response}");
                    }
                }
            }

            var rng = new Random();
            return Enumerable.Range(1, 5).Select(index => new WeatherForecast
            {
                Date = DateTime.Now.AddDays(index),
                TemperatureC = rng.Next(-20, 55),
                Summary = Summaries[rng.Next(Summaries.Length)]
            })
            .ToArray();
        }
    }
}
