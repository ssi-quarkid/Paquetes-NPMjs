import { Entry } from './message';

export interface MessageStorage {
  saveMessages(messages : Entry[]) : Promise<void>;

  getMessages() : Promise<Entry[]>;

  getLastPullDate() : Promise<Date>;

  updateLastPullDate(date : Date) : Promise<void>;
}
