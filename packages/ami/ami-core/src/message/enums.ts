export enum MessageTypes {
    STANDARD_MESSAGE = 'extrimian/messaging/standard',
    PROBLEM_REPORT = 'extrimian/messaging/problem-report',
    ACK = 'extrimian/messaging/ack',
  }
  
  export enum ContentType {
    TEXT = 'text/plain',
    PDF = 'application/pdf',
    PDF_UNSIGNED = 'application/pdf+unsigned',
    PDF_SIGNED = 'application/pdf+signed',
    JSON = 'application/json',
    SCHEMA_JSON = 'application/schema-instance+json',
    ANY = 'application/octet-stream'
  }
  
  export enum ACKStatus {
    OK = 'OK',
    PENDING = 'PENDING'
  }
  
  export enum PlsACKOnValues {
    RECEIPT = 'RECEIPT',
    OUTCOME = 'OUTCOME'
  }