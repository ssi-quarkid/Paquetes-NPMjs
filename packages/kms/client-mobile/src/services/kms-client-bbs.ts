import {
  Suite,
  suites,
  IKeyPair,
  BaseConverter,
  Base,
  IJWK,
} from "@quarkid/kms-core";
import "@quarkid/kms-suite-bbsbls2020";

export class KMSClientBbs {
  constructor() {}

  async create(suite: Suite): Promise<any> {
    const suiteType = suites.get(suite);
    const suiteInstance = new suiteType();
    const secrets: IKeyPair = await suiteInstance.create();
    const publicKeyJWK: IJWK = BaseConverter.convert(
      secrets.publicKey,
      Base.Base58,
      Base.JWK
    );

    const pkHex = BaseConverter.convert(publicKeyJWK, Base.JWK, Base.Hex);

    return { publicKeyJWK, pkHex, suite, secrets };
  }
}
