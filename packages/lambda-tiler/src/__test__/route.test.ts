import { Router } from '../router.js';
import o from 'ospec';
import { LambdaHttpRequest } from '@linzjs/lambda';

o.spec('Router', () => {
  function request(p: string): LambdaHttpRequest {
    return { path: p } as any;
  }
  o('should decode UTF8 correctly', () => {
    o(Router.action(request('/v1/version'))).deepEquals({ version: 'v1', name: 'version', rest: [] });
  });

  o('should ignore encoded paths', () => {
    o(Router.action(request('/v1/version%2fbar'))).deepEquals({ version: 'v1', name: 'version/bar', rest: [] });
    o(Router.action(request('/v1/tiles/%C5%8Dtorohanga%2fbar'))).deepEquals({
      version: 'v1',
      name: 'tiles',
      rest: ['ōtorohanga/bar'],
    });
  });
});
