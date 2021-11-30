import { SplitFactory } from '@splitsoftware/splitio';
import { Config } from './config';

export enum SplitTreatment {
  LayerSwitcherButton = 'layer-switcher-button',
}

export const SplitIo = {
  client: null as Promise<SplitIO.IClient | null> | null,
  _client: null as SplitIO.IClient | null,

  getClient(): Promise<SplitIO.IClient | null> {
    if (this.client != null) return this.client;
    if (Config.SplitApiKey === '') {
      this.client = Promise.resolve(null);
      return this.client;
    }

    const factory = SplitFactory({
      core: {
        authorizationKey: Config.SplitApiKey,
        key: Config.ApiKey,
      },
    });

    this.client = new Promise((resolve) => {
      const client = factory.client();
      client.on(client.Event.SDK_READY, () => {
        SplitIo._client = client;
        resolve(client);
      });
    });
    return this.client;
  },

  getClientSync(): SplitIO.IClient | null {
    if (this._client) return this._client;
    this.getClient();
    return null;
  },

  getTreatment(key: SplitTreatment): string | null {
    const client = SplitIo.getClientSync();
    if (client == null) return null;
    return client.getTreatment(key);
  },
};

window.splitIo = SplitIo;
