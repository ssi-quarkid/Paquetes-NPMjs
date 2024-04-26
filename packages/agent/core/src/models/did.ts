import { decode } from 'base-64';

export class DID {
  value: string;

  private constructor(did: string) {
    if (this.validate(did)) {
      this.value = did;
    }
  }

  /**
   * This method converts a string value or full verification method id to a data value DID object.
   *
   * @param did - DID input. This value can also be a full verification method id.
   * @returns Data value object that represent a DID
   */
  static from(did: string) {
    if (did?.indexOf('#') > -1) {
      return new DID(did.substring(0, did.indexOf('#')));
    }
    return new DID(did);
  }

  validate(did: string): boolean {
    return true;
  }

  getDidMethod(): string {
    return this.value.substring(0, this.value.lastIndexOf(':'));
  }

  isEqual(other: DID): boolean {
    // Lógica de comparación personalizada aquí
    // Compara los atributos relevantes de los objetos y devuelve true si son iguales, false en caso contrario
    return this.value == other.value;
  }

  public isLongDIDFor(shortDID: DID): boolean {
    return !shortDID.isLongDID() && this.isLongDID() && this.value.indexOf(shortDID.value) != -1;
  }

  public isShortDIDFor(longDID: DID): boolean {
    return longDID.isLongDIDFor(this);
  }

  getDIDSuffix() {
    return this.isLongDID() ? this.getLongDIDSuffix() : this.value.substring(this.value.lastIndexOf(":") + 1);
  }

  private getLongDIDSuffix() {
    const ultimoIndice = this.value.lastIndexOf(":");
    if (ultimoIndice === -1) {
      return null;
    }

    const index = this.value.lastIndexOf(":", ultimoIndice - 1);
    return this.value.substring(index + 1);
  }

  isLongDID(): boolean {
    try {
      const lastSegment = this.value.substring(this.value.lastIndexOf(':') + 1);
      const data = decode(lastSegment);
      const obj = JSON.parse(data);

      return obj.delta != null;
    } catch {
      return false;
    }
  }
}
