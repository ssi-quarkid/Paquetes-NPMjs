import { DIDCommMessageIStorage , DIDCommThreadIStorage} from "@quarkid/did-core";
import { OneClickMessage } from "../utils/message";
export class OneClickMessageStorage extends DIDCommMessageIStorage<OneClickMessage>{}
export class OneClickThreadStorage extends DIDCommThreadIStorage<OneClickMessage>{}