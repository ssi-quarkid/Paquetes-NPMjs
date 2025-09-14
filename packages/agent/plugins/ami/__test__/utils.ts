import * as fs from "fs"
import * as path from "path"
export function calculateSizeInKB(uint8Array) {
    const bytes = uint8Array.length;
    const megabytes = bytes / (1024); // Convert bytes to megabytes
    return megabytes;
  }


export function readFileAsUint8Array(filePath) {
    const fileContent = fs.readFileSync(filePath, 'binary');
    const uint8Array = new Uint8Array(fileContent.length);
    
    for (let i = 0; i < fileContent.length; i++) {
      uint8Array[i] = fileContent.charCodeAt(i) & 0xff;
    }
  
    return uint8Array;
  }
  

export async function fileExists(filePath) {
    return new Promise(resolve => {
      fs.access(filePath, fs.constants.F_OK, err => {
        if (err) {
          resolve(false);
        } else {
          resolve(true);
        }
      });
    });
  }
  
// export async function printChats(agent: AMISDK , did:string) {
//     // console.log("printing chats for: " , did)
//     let chats = await agent.getChats()
//     let messagesPromises = chats.map( x=> x.getChatMessages());
//     let messages = await Promise.all(messagesPromises);
//     // messages.map ( x => x.map(x=> {
//     //     return { "message":x.message.toString() , "status": x.status}
//     // })
//     // console.log(messages.length)
//     messages.forEach(x => console.log(x.map(y => {
//         return { 
//             "body": (<any>y.message.body).data, 
//             "to": y.message.to[0] , 
//             "from": y.message.from , 
//             "status": y.status , 
//             "time": y.message.create_time
//         }})))
// }
export async function deleteFilesInFolder(folderPath: string): Promise<void> {
    try {
    
      const files = await fs.promises.readdir(folderPath);
  
      for (const file of files) {
        const filePath = path.join(folderPath, file);
        await fs.promises.unlink(filePath);
        // console.log(`Deleted: ${filePath}`);
      }
  
    //   console.log('All files deleted successfully.');
    } catch (error) {
      console.error('Error deleting files:', error);
    }
  }