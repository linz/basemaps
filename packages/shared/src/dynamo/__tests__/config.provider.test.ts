import o from 'ospec';
import { ConfigProviderDynamo } from '../dynamo.config.js';

o.spec('ConfigProviderDynamo', () => {
  const Config = new ConfigProviderDynamo('table');

  o.spec('id', () => {
    o('should create ids', () => {
      o(Config.Provider.id('linz')).equals('pv_linz');
    });
  });
});
