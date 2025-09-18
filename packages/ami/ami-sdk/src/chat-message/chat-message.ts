import {Message } from "@quarkid/ami-core"

export enum IncomingChatMessageStatus {
    NOTIFICATION = 'incoming/notification',
    // RECEIVED = 'outgoing/received',
    RECEIVED = 'incoming/received',
    MUST_CONFIRM = 'incoming/must-confirm',
    CONFIRMED = 'incoming/confirmed',
    ERROR = 'incoming/error'
}

export enum OutgoingChatMessageStatus {
    NOTIFICATION = 'outgoing/notification',
    AWAITING_RECEIVED = 'outgoing/awaiting-received',
    RECEIVED = 'outgoing/received',
    AWAITING_CONFIRMATION = 'outgoing/awaiting-confirmation',
    RECEIVED_AWAITING_CONFIRMATION = 'outgoing/received-awaiting-confirmation',
    CONFIRMED = 'outgoing/confirmed',
    ERROR = 'outgoing/error'
}

export type IncomingChatMessage = ChatMessage & {
    status: IncomingChatMessageStatus
}

export  type OutgoingChatMessage = ChatMessage & {
    status : OutgoingChatMessageStatus
}

export type ChatMessage = {
    message: Message,
    status: IncomingChatMessageStatus |  OutgoingChatMessageStatus
}