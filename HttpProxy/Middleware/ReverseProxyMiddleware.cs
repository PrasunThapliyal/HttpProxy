
namespace HttpProxy.Middleware
{
    using HttpProxy.Middleware.POCO;
    using Microsoft.AspNetCore.Http;
    using Microsoft.AspNetCore.Mvc;
    using Microsoft.Extensions.Logging;
    using Newtonsoft.Json;
    using System;
    using System.Collections.Generic;
    using System.IO;
    using System.Linq;
    using System.Net.Http;
    using System.Net.Http.Headers;
    using System.Reflection.Metadata.Ecma335;
    using System.Text;
    using System.Threading.Tasks;

    public class ReverseProxyMiddleware
    {
        private readonly HttpClient _httpClient;
        private readonly RequestDelegate _nextMiddleware;
        private readonly ILogger<ReverseProxyMiddleware> _logger;
        private static long _counter = 0;
        private static ProxyRules _proxyRules;


        public ReverseProxyMiddleware(RequestDelegate nextMiddleware, ILogger<ReverseProxyMiddleware> logger)
        {
            _nextMiddleware = nextMiddleware;
            _logger = logger ?? throw new ArgumentNullException(nameof(logger));
            
            if (_proxyRules == null) {
                _proxyRules = ReadJsonDataFile<ProxyRules>("Middleware//ProxyRules.json");
            }

            //// https://stackoverflow.com/questions/10642528/how-does-one-configure-httpclient-not-to-automatically-redirect-when-it-receives
            //var handler = new HttpClientHandler()
            //{
            //    AllowAutoRedirect = false
            //};

            //_httpClient = new HttpClient(handler);

            {
                // For on-prem machines that do not have a valid SSL cert, such as 10.182.39.22
                var handler = new HttpClientHandler()
                {
                    ServerCertificateCustomValidationCallback = (sender, cert, chain, sslPolicyErrors) => { return true; }
                };
                _httpClient = new HttpClient(handler);
            }

            //_httpClient = new HttpClient();
            _httpClient.Timeout = TimeSpan.FromMinutes(180);
        }


        //[DisableRequestSizeLimit] // Does not work
        public async Task Invoke(HttpContext context)
        {
            var counter = _counter++;

            if (context.Request.Path.ToString().Contains("WebSocketsService"))
            {
                await _nextMiddleware(context);
                return;
            }

            if (context.Request.Path.ToString().Contains("WeatherForecast"))
            {
                await _nextMiddleware(context);
                return;
            }

            var sw = System.Diagnostics.Stopwatch.StartNew();
            var targetUri = BuildTargetUri(context.Request);

            if (targetUri != null)
            {
                var targetRequestMessage = CreateTargetMessage(context, targetUri);
                _logger.LogInformation($"{counter}: {targetRequestMessage.Method}, {targetRequestMessage.RequestUri}");

                try
                {
                    using (var responseMessage = await _httpClient.SendAsync(targetRequestMessage, HttpCompletionOption.ResponseHeadersRead, context.RequestAborted))
                    {
                        _logger.LogInformation($"{counter}: {responseMessage.StatusCode}, Time: {sw.ElapsedMilliseconds} ms");
                        context.Response.StatusCode = (int)responseMessage.StatusCode;
                        CopyFromTargetResponseHeaders(context, responseMessage);
                        await responseMessage.Content.CopyToAsync(context.Response.Body);
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogError($"[{counter}]: Exception: {ex}");
                    throw;
                }
                return;
            }
            await _nextMiddleware(context);
        }

        private HttpRequestMessage CreateTargetMessage(HttpContext context, Uri targetUri)
        {
            var requestMessage = new HttpRequestMessage();
            CopyFromOriginalRequestContentAndHeaders(context, requestMessage);

            requestMessage.RequestUri = targetUri;
            requestMessage.Headers.Host = targetUri.Host;
            requestMessage.Method = GetMethod(context.Request.Method);

            var bearerToken = context.Request.Cookies["uac.authorization"];
            if (!string.IsNullOrEmpty(bearerToken))
            {
                requestMessage.Headers.Remove("Authorization");
                requestMessage.Headers.Add("Authorization", $"Bearer {bearerToken}");
            }

            var cienaUserName = context.Request.Cookies["uac.username"];
            if (!string.IsNullOrEmpty(cienaUserName))
            {
                requestMessage.Headers.Remove("ciena-user-name");
                requestMessage.Headers.Add("ciena-user-name", $"{cienaUserName}");
            }

            var cienaUserId = context.Request.Cookies["uac.user_id"];
            if (!string.IsNullOrEmpty(cienaUserName))
            {
                requestMessage.Headers.Remove("ciena-user-id");
                requestMessage.Headers.Add("ciena-user-id", $"{cienaUserId}");
            }

            // Copy Cookies: https://stackoverflow.com/questions/65228306/simple-way-to-transfer-cookies-from-current-httpcontext-into-new-created-httpcli
            if (context.Request.Headers.TryGetValue("Cookie", out var cookies))
            {
                requestMessage.Headers.TryAddWithoutValidation("Cookie", cookies.ToArray());
            }

            return requestMessage;
        }

        private void CopyFromOriginalRequestContentAndHeaders(HttpContext context, HttpRequestMessage newRequestMessage)
        {
            // ref :https://stackoverflow.com/questions/25044166/how-to-clone-a-httprequestmessage-when-the-original-request-has-content

            var requestMethod = context.Request.Method;

            if (context.Request.ContentLength!= null && context.Request.ContentLength != 0)
            {
                //var memStream = new MemoryStream();
                //await context.Request.Body.CopyToAsync(memStream);
                //memStream.Position = 0;
                //newRequestMessage.Content = new StreamContent(memStream);


                var streamContent = new StreamContent(context.Request.Body);
                newRequestMessage.Content = streamContent;
                streamContent.ReadAsStringAsync().GetAwaiter().GetResult();



                context.Request.Headers?.ToList().ForEach(
                    header =>
                    {
                        if (header.Key.Equals("Content-Type", StringComparison.CurrentCultureIgnoreCase))
                        {
                            newRequestMessage.Content.Headers.Add(header.Key, header.Value.ToArray());
                        }
                    });
            }

            context.Request.Headers.ToList().ForEach(
                header => newRequestMessage.Headers.TryAddWithoutValidation(header.Key, header.Value.ToArray()));
        }

        private void CopyFromOriginalRequestContentAndHeaders_(HttpContext context, HttpRequestMessage requestMessage)
        {
            var requestMethod = context.Request.Method;

            if (!HttpMethods.IsGet(requestMethod) &&
              !HttpMethods.IsHead(requestMethod) &&
              //!HttpMethods.IsDelete(requestMethod) &&
              !HttpMethods.IsTrace(requestMethod))
            {
                var streamContent = new StreamContent(context.Request.Body);
                requestMessage.Content = streamContent;
                streamContent.ReadAsStringAsync().GetAwaiter().GetResult();
            }

            // TODO : Check this for Form data: https://codingcanvas.com/different-ways-of-uploading-files-using-http-based-apis-part-1/

            //if (context.Request.Path.ToString().Contains("sfdataprovider") 
            //    || context.Request.Path.ToString().Contains("solutionmanager")
            //    || (context.Request.Path.ToString().Contains("tron") && !context.Request.Path.ToString().Contains("tokens"))
            //    || context.Request.Path.ToString().Contains("appbar")
            //    || context.Request.Path.ToString().Contains("ems/api/v1"))
            //{
            //    return;
            //}

            foreach (var header in context.Request.Headers)
            {
                //if (header.Key == ":method" || header.Key == "Upgrade-Insecure-Requests")
                //{
                //    continue;
                //}

                if (requestMessage.Content != null)
                {
                    if (header.Key.Equals("Content-Type", StringComparison.CurrentCultureIgnoreCase))
                    {
                        AddHeader(requestMessage.Content?.Headers, header.Key, header.Value.ToString());
                    }
                }

                AddHeader(requestMessage.Headers, header.Key, header.Value.ToString());
            }

        }

        private void AddHeader(HttpHeaders headers, string headerName, string headerValue)
        {
            if (headers == null)
            {
                _logger.LogWarning($"null headers. {headerName}, {headerValue}");
                return;
            }

            headers.TryGetValues(headerName, out IEnumerable<string> values);
            if (values?.Count() > 0)
            {
                _logger.LogWarning($"A {headers.GetType()} type header {headerName} with value {values} already exists");
            }
            else
            {
                headers.TryAddWithoutValidation(headerName, headerValue);
            }
        }

        private void CopyFromTargetResponseHeaders(HttpContext context, HttpResponseMessage responseMessage)
        {
            foreach (var header in responseMessage.Headers)
            {
                context.Response.Headers[header.Key] = header.Value.ToArray();
            }

            foreach (var header in responseMessage.Content.Headers)
            {
                context.Response.Headers[header.Key] = header.Value.ToArray();
            }

            context.Response.Headers.Remove("transfer-encoding");
        }
        private static HttpMethod GetMethod(string method)
        {
            if (HttpMethods.IsDelete(method)) return HttpMethod.Delete;
            if (HttpMethods.IsGet(method)) return HttpMethod.Get;
            if (HttpMethods.IsHead(method)) return HttpMethod.Head;
            if (HttpMethods.IsOptions(method)) return HttpMethod.Options;
            if (HttpMethods.IsPost(method)) return HttpMethod.Post;
            if (HttpMethods.IsPut(method)) return HttpMethod.Put;
            if (HttpMethods.IsTrace(method)) return HttpMethod.Trace;
            return new HttpMethod(method);
        }

        private Uri BuildTargetUri(HttpRequest request)
        {
            Uri targetUri = null;

            foreach (var proxyRule in _proxyRules.ProxyPass)
            {
                if (targetUri == null)
                {
                    targetUri = ProxyPass(request,
                        pathStartsWith: proxyRule.PathStartsWith,
                        replacePathSegmentWith: proxyRule.ReplacePathSegmentWith);
                }

                if (targetUri != null)
                {
                    //_logger.LogInformation($"Request: {request.Path}, replaced: {targetUri}");

                    break;
                }
            }
            
            return targetUri;
        }


        private T ReadJsonDataFile<T>(string path)
        {
            string content = string.Empty;

            using (var reader = new StreamReader(path, Encoding.UTF8))
            {
                content = reader.ReadToEnd();
            }

            return JsonConvert.DeserializeObject<T>(content);
        }

        private static Uri ProxyPass(HttpRequest request, string pathStartsWith, string replacePathSegmentWith)
        {
            Uri targetUri = null;

            pathStartsWith = RemoveTralingSlash(pathStartsWith);
            replacePathSegmentWith = RemoveTralingSlash(replacePathSegmentWith);

            if (request.Path.StartsWithSegments(pathStartsWith, out var remainingPath))
            {
                if (replacePathSegmentWith.EndsWith('/') && remainingPath.StartsWithSegments("/", out _))
                {
                    replacePathSegmentWith = RemoveTralingSlash(replacePathSegmentWith);
                }

                var queryString = request.QueryString.Value;
                targetUri = new Uri(replacePathSegmentWith + remainingPath + queryString);
            }

            return targetUri;
        }

        private static string RemoveTralingSlash(string pathStartsWith)
        {
            return pathStartsWith.TrimEnd(new[] { '/', '\\' });
        }
    }
}
