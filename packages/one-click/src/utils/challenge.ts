import { OneClickMessage } from './message';

export const extractExpectedChallenge = (
  message: any,
  challenge: string,
): boolean => {
  if (
    message?.body?.requesterChallenge === challenge ||
    message?.body?.responderChallenge === challenge
  ) {
    return true;
  }
  return false;
};
