export const ApplicationJson = 'application/json';
/** Common http headers */
export const HttpHeader = {
    ApiKey: 'X-LINZ-Api-Key',
    CacheControl: 'Cache-Control',
    ContentEncoding: 'Content-Encoding',
    ContentType: 'Content-Type',
    CorrelationId: 'X-LINZ-Correlation-Id',
    Cors: 'Access-Control-Allow-Origin',
    ETag: 'ETag',
    IfNoneMatch: 'If-None-Match',
    RateCount: 'X-RateLimit-Count',
    RateExpire: 'X-RateLimit-Expires',
    RateLimit: 'X-RateLimit-Limit',
    RequestId: 'X-LINZ-Request-Id',
    Server: 'Server',
    ServerTiming: 'Server-Timing',
};

/** Amazon specific headers */
export const HttpHeaderAmazon = {
    CloudfrontId: 'X-Amz-Cf-Id',
    TraceId: 'X-Amzn-Trace-Id',
};
