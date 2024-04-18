import { FinalizeRequestMiddleware, MetadataBearer } from '@smithy/types';

/** Force fully qualifed domain names (FQDN) for s3 requests to save DNS lookups */
interface Fqdn {
  /**
   * Should S3 requests be converted to Fully Qualified domains (FQDN)
   *
   * @default false
   */
  isForcedFqdn: boolean;
  /**
   * AWS SDK middleware function to force fully qualified domain name  on s3 requests
   *
   * AWS S3 inside of kubernetes triggers a lot of DNS requests
   * by forcing a fully qualified domain name lookup (trailing ".")
   * it greatly reduces the number of DNS requests we make
   */
  middleware: FinalizeRequestMiddleware<object, MetadataBearer>;
}
export const Fqdn: Fqdn = {
  isForcedFqdn: false,
  middleware: (next) => {
    return (args) => {
      // Forced FQDN is disabled
      if (Fqdn.isForcedFqdn === false) return next(args);

      if (hasHostName(args.request) && args.request.hostname.endsWith('.s3.ap-southeast-2.amazonaws.com')) {
        args.request.hostname += '.';
      }
      return next(args);
    };
  },
};

/** Check to see if hostname exists inside of a object */
function hasHostName(x: unknown): x is { hostname: string } {
  if (x == null) return false;
  if (typeof x === 'object' && 'hostname' in x && typeof x.hostname === 'string') return true;
  return false;
}
