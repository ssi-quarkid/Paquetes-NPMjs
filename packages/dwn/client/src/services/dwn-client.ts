import { EventEmitter } from 'events';
import { DWNClientEvent } from '../types/enums';
import { InboxConsumer } from './inbox-consumer';
import { InboxSender, SendMessageParams } from './inbox-sender';
import { Entry, MessageDescriptor } from '../types/message';
import { MessageStorage } from '../types/message-storage';
import { match, parseDateToUnixTimestamp } from '../utils';

export { SendMessageParams } from './inbox-sender';

export interface DWNClientConfig {
  did: string;
  inboxURL: string;
  storage: MessageStorage;
}

export class DWNClient {
  private readonly consumer: InboxConsumer;
  private readonly sender: InboxSender;
  private readonly emitter: EventEmitter;
  private readonly storage: MessageStorage;

  constructor(config: DWNClientConfig) {
    this.consumer = new InboxConsumer(config.inboxURL, config.did);
    this.sender = new InboxSender();
    this.emitter = new EventEmitter();
    this.storage = config.storage;
  }

  private async checkOutLastPullDate(): Promise<Date> {
    let lastPullDate = await this.storage.getLastPullDate();
    if (!lastPullDate) {
      lastPullDate = new Date();
      await this.storage.updateLastPullDate(lastPullDate);
    }
    return lastPullDate;
  }

  addSubscriber<T = any>(callback: (messages: Entry[]) => Promise<T>): void {
    this.emitter.on(DWNClientEvent.MessageReceived, callback);
  }

  async pullNewMessageWait(): Promise<void> {
    const dateFilter = parseDateToUnixTimestamp(
      await this.checkOutLastPullDate()
    );
    const newMessages = await this.consumer.getMessages({ dateCreated: dateFilter });

    await this.storage.saveMessages(newMessages);
    await this.storage.updateLastPullDate(new Date());
    this.emitter.emit(DWNClientEvent.MessageReceived, newMessages);
  }

  async pullNewMessages(): Promise<void> {
    const dateFilter = parseDateToUnixTimestamp(
      await this.checkOutLastPullDate()
    );
    this.consumer
      .getMessages({ dateCreated: dateFilter })
      .then(async (newMessages) => {
        await this.storage.saveMessages(newMessages);
        await this.storage.updateLastPullDate(new Date());
        this.emitter.emit(DWNClientEvent.MessageReceived, newMessages);
      });
  }

  async getMessages(
    filters: Omit<MessageDescriptor, 'cid' | 'method'>
  ): Promise<Entry[]> {
    const allMessages = await this.storage.getMessages();
    return allMessages.filter(
      (message) =>
        match(filters, message.descriptor) ||
        (filters.root ? filters.root === message?.descriptor?.objectId : false)
    );
  }

  async sendMessage(params: SendMessageParams): Promise<void> {
    const sentMessages = await this.sender.sendMessage(params);
    await this.storage.saveMessages(
      sentMessages.map((message) => ({
        ...message,
        data: message.data,
      }))
    );
  }
}
