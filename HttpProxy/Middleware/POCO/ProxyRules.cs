using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace HttpProxy.Middleware.POCO
{
    public class ProxyRules
    {
        [JsonProperty("proxy_pass", Required = Required.Default, NullValueHandling = NullValueHandling.Ignore)]
        public List<ProxyRule> ProxyPass { get; set; }
    }

}
