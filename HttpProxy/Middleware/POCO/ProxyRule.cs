using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace HttpProxy.Middleware.POCO
{
    public class ProxyRule
    {
        [JsonProperty("pathStartsWith", Required = Required.Default, NullValueHandling = NullValueHandling.Ignore)]
        public string PathStartsWith { get; set; }


        [JsonProperty("replacePathSegmentWith", Required = Required.Default, NullValueHandling = NullValueHandling.Ignore)]
        public string ReplacePathSegmentWith { get; set; }
    }
}
