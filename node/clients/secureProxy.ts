import type { InstanceOptions, IOContext } from '@vtex/api'
import { ExternalClient } from '@vtex/api'

export default class SecureProxy extends ExternalClient {
  constructor(context: IOContext, options?: InstanceOptions) {
    super('', context, {
      ...options,
    })
  }

  public async applyProxy<T>(
    data: any,
    options: InstanceOptions,
  ): Promise<T> {
    const config = { ...options };

    return this.http.post('/.../proxy', data, config);
  }
}
