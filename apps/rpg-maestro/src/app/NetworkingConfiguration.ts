import { Inject, Injectable } from '@nestjs/common';

@Injectable()
export class NetworkingConfiguration {
  private readonly defaultFrontEndDomain: string;

  constructor(
    @Inject('NetworkingConfiguration_DEFAULT_FRONTEND_DOMAIN') private readonly defaultFrontEndDomainEnv: string
  ) {
    if (!defaultFrontEndDomainEnv && !process.env.DEFAULT_FRONTEND_DOMAIN) {
      throw new Error(`DEFAULT_FRONTEND_DOMAIN is required to be set but was: "${defaultFrontEndDomainEnv}"`);
    }
    this.defaultFrontEndDomain = defaultFrontEndDomainEnv ?? process.env.DEFAULT_FRONTEND_DOMAIN;
  }

  public getDefaultFrontEndDomain(): string {
    return this.defaultFrontEndDomain;
  }
}
