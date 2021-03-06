
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

            var sw = System.Diagnostics.Stopwatch.StartNew();
            var targetUri = BuildTargetUri(context.Request);

            if (targetUri != null)
            {
                var targetRequestMessage = CreateTargetMessage(context, targetUri);
                _logger.LogInformation($"{counter}: {targetRequestMessage.Method}, {targetRequestMessage.RequestUri}");

                using (var responseMessage = await _httpClient.SendAsync(targetRequestMessage, HttpCompletionOption.ResponseHeadersRead, context.RequestAborted))
                {
                    _logger.LogInformation($"{counter}: {responseMessage.StatusCode}, Time: {sw.ElapsedMilliseconds} ms");
                    context.Response.StatusCode = (int)responseMessage.StatusCode;
                    CopyFromTargetResponseHeaders(context, responseMessage);
                    await responseMessage.Content.CopyToAsync(context.Response.Body);
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
                requestMessage.Headers.Add("Authorization", $"Bearer {bearerToken}");
            }

            var cienaUserName = context.Request.Cookies["uac.username"];
            if (!string.IsNullOrEmpty(cienaUserName))
            {
                requestMessage.Headers.Add("ciena-user-name", $"{cienaUserName}");
            }

            var cienaUserId = context.Request.Cookies["uac.user_id"];
            if (!string.IsNullOrEmpty(cienaUserName))
            {
                requestMessage.Headers.Add("ciena-user-id", $"{cienaUserId}");
            }

            // Copy Cookies: https://stackoverflow.com/questions/65228306/simple-way-to-transfer-cookies-from-current-httpcontext-into-new-created-httpcli
            if (context.Request.Headers.TryGetValue("Cookie", out var cookies))
            {
                requestMessage.Headers.TryAddWithoutValidation("Cookie", cookies.ToArray());
            }

            return requestMessage;
        }

        private void CopyFromOriginalRequestContentAndHeaders(HttpContext context, HttpRequestMessage requestMessage)
        {
            var requestMethod = context.Request.Method;

            if (!HttpMethods.IsGet(requestMethod) &&
              !HttpMethods.IsHead(requestMethod) &&
              //!HttpMethods.IsDelete(requestMethod) &&
              !HttpMethods.IsTrace(requestMethod))
            {
                var streamContent = new StreamContent(context.Request.Body);
                requestMessage.Content = streamContent;
            }

            foreach (var header in context.Request.Headers)
            {
                //requestMessage.Content?.Headers.TryAddWithoutValidation(header.Key, header.Value.ToArray());
                requestMessage.Content?.Headers.TryAddWithoutValidation(header.Key, header.Value.ToString());
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

            //context.Response.Headers["Connection"] = new string[] { "close" };
            //context.Response.Headers["Cache-Control"] = new string[] { "no-cache", "no-store", "no-transform" };

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

            //targetUri = ProxyPass(request, 
            //    pathStartsWith: "/googleforms", 
            //    replacePathSegmentWith: "http://localhost:5006/scenariobuilder/api/v1/networkdesigns/4c01857f-e044-4854-aae1-851ad3c252d1?include=sites,fibers");

            //List<(string pathStartsWith, string replacePathSegmentWith)> proxyPassRules = new List<(string pathStartsWith, string replacePathSegmentWith)>()
            //{
            //    ("/planner-plus-ui/designs/", "http://127.0.0.1:8081/"),
            //    ("/planner-plus-ui/design-wizard/", "http://127.0.0.1:8080/"),
            //    ("/planner-plus-ui/design-settings/", "http://127.0.0.1:8082/"),
            //    ("/login/", "https://dev.apps.ciena.com/login/"),
            //    ("/sso/api/v1/identity-providers/", "https://dev.apps.ciena.com/sso/api/v1/identity-providers/"),
            //    ("/sso/api/v1/identity-providers?next=%2F", "https://dev.apps.ciena.com/sso/api/v1/identity-providers?next=%2F"),
            //    ("/tron/", "https://dev.apps.ciena.com/tron/"),
            //    ("/equipmenttopologyplanning", "http://localhost:5001/equipmenttopologyplanning"), // TODO : Need to add Header
            //    ("/scenariobuilder", "http://localhost:5006/scenariobuilder"),
            //    ("/sfdataprovider", "https://dev.apps.ciena.com/sfdataprovider"),
            //    ("/solutionmanager", "https://dev.apps.ciena.com/solutionmanager"),
            //    ("/nbis", "https://dev.apps.ciena.com/nbis"),
            //    //("", ""),
            //    //("", ""),
            //    //("", ""),
            //    //("", ""),
            //    //("", ""),
            //    //("", ""),
            //    //("", ""),
            //    //("", ""),
            //    ("/", "https://dev.apps.ciena.com/"),
            //    //("/", "http://127.0.0.1:8081/"),
            //};

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
                //if (replacePathSegmentWith.EndsWith('/') && remainingPath.StartsWithSegments("/", out _))
                //{
                //    replacePathSegmentWith = RemoveTralingSlash(replacePathSegmentWith);
                //}
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
