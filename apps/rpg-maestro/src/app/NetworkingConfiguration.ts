import { Inject, Injectable } from '@nestjs/common';

@Injectable()
export class NetworkingConfiguration {
  private readonly defaultFrontEndDomain: string;

  constructor(
    @Inject('NetworkingConfiguration_DEFAULT_FRONTEND_DOMAIN') private readonly defaultFrontEndDomainEnv: string
  ) {
    if (!defaultFrontEndDomainEnv) {
      throw new Error(`DEFAULT_FRONTEND_DOMAIN is required to be set: "${defaultFrontEndDomainEnv}"`);
    }
    this.defaultFrontEndDomain = defaultFrontEndDomainEnv;
  }

  public getDefaultFrontEndDomain(): string {
    return this.defaultFrontEndDomain;
  }
}
