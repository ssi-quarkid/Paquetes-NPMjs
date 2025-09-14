import { error } from "console";
import { IEncoder } from "./IEncoder";
import { isBase64String } from "./utils";

function concatenateChunksWithPadding(chunks) : string{
  const concatenatedChunks = chunks.slice(0, -1).map(chunk => chunk.replace(/=*$/, '')).join('');
  const lastChunk = chunks[chunks.length - 1];
  return concatenatedChunks + lastChunk;
}

function chunkedAtobDecode(encodedData, chunkSize) {
  const decodedChunks = [];
  
  for (let i = 0; i < encodedData.length; i += chunkSize) {
    const chunk = encodedData.slice(i, i + chunkSize);
    decodedChunks.push(new Uint8Array(atob(chunk).split('').map(char => char.charCodeAt(0))));
  }
  return decodedChunks

}
function concatenateDecodedChunks(decodedChunks) {
  const concatenatedData = new Uint8Array(
    decodedChunks.reduce((totalLength, chunk) => totalLength + chunk.length, 0)
  );

  let offset = 0;

  decodedChunks.forEach((chunk) => {
    concatenatedData.set(chunk, offset);
    offset += chunk.length;
  });

  return concatenatedData;
}

export class ChunkedEncoder implements IEncoder {
    private chunkSize;
    constructor( chunkSize: number){
      //tiene que ser divisible por 12 para que el enconding y decoding en base64 no haga problemas
      this.chunkSize = chunkSize - chunkSize % 12
      if(this.chunkSize <= 0)
        this.chunkSize =12;
    }
    
    async encodeUint8ArrayToBase64(array: Uint8Array ) : Promise<string>{
        const CHUNK_SIZE = this.chunkSize; // Adjust this value based on your needs
        const chunks = [];
        const totalChunks = Math.ceil(array.length / CHUNK_SIZE);
      
        for (let i = 0; i < totalChunks; i++) {
          const start = i * CHUNK_SIZE;
          const end = start + CHUNK_SIZE;
          const chunk = array.slice(start, end);
          const encodedChunk = btoa(String.fromCharCode.apply(null, chunk));
          chunks.push(encodedChunk);
        }
        return concatenateChunksWithPadding(chunks);
      }

    async decodeBase64ToUint8Array(base64Data: string ): Promise<Uint8Array> {
        if(!isBase64String(base64Data))
            throw new Error("invalid base64")
        const CHUNK_SIZE = this.chunkSize; // Adjust this value based on your needs
        const decodedData : Uint8Array[] = chunkedAtobDecode(base64Data , CHUNK_SIZE);
        return concatenateDecodedChunks(decodedData);
      }

}

  //  if (i + chunkSize >= encodedData.length) {
  //   } else {
  //     try{
        
  //       const paddingLength = 4 - (chunk.length % 4); // Calculate the padding needed
  //       const paddedChunk = chunk + '='.repeat(paddingLength%4); // Add padding if needed
  //       decodedChunks.push(new Uint8Array(atob(paddedChunk).split('').map(char => char.charCodeAt(0))));
  //     }catch(err){
  //       const paddingLength = 4 - (chunk.length % 4); // Calculate the padding needed
  //       const paddedChunk = chunk + '='.repeat(paddingLength % 4); // Add padding if needed
  //       console.log("invalid character in chunk:" , paddedChunk)
  //       throw err
  //     }
  //   }
//   }
  
//   return decodedChunks;
// }