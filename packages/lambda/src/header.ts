export const ApplicationJson = 'application/json';
/** Common http headers */
export const HttpHeader = {
    CorrelationId: 'X-LINZ-Correlation-Id',
    RequestId: 'X-LINZ-Request-Id',
    ApiKey: 'X-LINZ-Api-Key',
    CacheControl: 'Cache-Control',
    ContentType: 'Content-Type',
    ETag: 'ETag',
    IfNoneMatch: 'If-None-Match',
    RateLimit: 'X-RateLimit-Limit',
    RateCount: 'X-RateLimit-Count',
    RateExpire: 'X-RateLimit-Expires',
    Cors: 'Access-Control-Allow-Origin',
};

/** Amazon specific headers */
export const HttpHeaderAmazon = {
    CloudfrontId: 'X-Amz-Cf-Id',
    TraceId: 'X-Amzn-Trace-Id',
};
