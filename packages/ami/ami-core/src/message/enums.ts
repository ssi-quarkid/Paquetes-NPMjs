export enum MessageTypes {
    STANDARD_MESSAGE = 'quarkid/messaging/standard',
    PROBLEM_REPORT = 'quarkid/messaging/problem-report',
    ACK = 'quarkid/messaging/ack',
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