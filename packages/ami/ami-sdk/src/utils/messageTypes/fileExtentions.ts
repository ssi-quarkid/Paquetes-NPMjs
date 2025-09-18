
import { ContentType } from "@quarkid/ami-core";


export function getFileExtention( type: ContentType): string {
    switch(type){
        case ContentType.PDF:
            return 'pdf'
        default:
            return 'file'
    }
}