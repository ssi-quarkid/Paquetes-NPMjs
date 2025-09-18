export interface IEncoder {
    encodeUint8ArrayToBase64(array: Uint8Array) : Promise<string>

    decodeBase64ToUint8Array(base64Data: string): Promise<Uint8Array>
}