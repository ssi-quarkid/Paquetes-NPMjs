
function isBase64MiddleChunk(chunk) {
    return chunk.length % 4 === 0 && /^[A-Za-z0-9+/]+$/.test(chunk);
}
  
function isBase64LastChunk(chunk) {
    // console.log("chunk")
    const validBase64Regex = /^[A-Za-z0-9+/]*/;
    const validPaddingRegex = /^[A-Za-z0-9+/]+={0,2}$/;
    
    if (!validBase64Regex.test(chunk)) {
      return false;
    }
    
    if (!validPaddingRegex.test(chunk)) {
      return false;
    }
    
    return true;
  }
   
export function isBase64String(input :string) : boolean{
    if(input.length % 4 != 0)
        return false
    const CHUNK_SIZE = 1024;
    const totalChunks = Math.ceil(input.length / CHUNK_SIZE);
  
    for (let i = 0; i < totalChunks; i++) {
      const chunk = input.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE);
      
      if (i === totalChunks - 1) {
        if (!isBase64LastChunk(chunk)) {
            console.log("failed in the last one")
            return false
        }
      } else if (!isBase64MiddleChunk(chunk)) {
        console.log("failed in the middle")

        return false
        }
    }
    return true
  }