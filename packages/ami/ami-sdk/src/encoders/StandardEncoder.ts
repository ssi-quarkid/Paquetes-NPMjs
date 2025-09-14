import { IEncoder } from "./IEncoder";


export class StandardEncoder implements IEncoder {

    async encodeUint8ArrayToBase64(array: Uint8Array) : Promise<string>{
       return btoa(String.fromCharCode.apply(null, array));
    }

    async decodeBase64ToUint8Array(base64Data: string): Promise<Uint8Array> {
        const decodedData = atob(base64Data);
        const uint8Array = new Uint8Array(decodedData.length);
      
        for (let i = 0; i < decodedData.length; i++) {
          uint8Array[i] = decodedData.charCodeAt(i);
        }
      
        return uint8Array;
      }

}
