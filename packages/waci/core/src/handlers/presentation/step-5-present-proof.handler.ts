import { isNil } from 'lodash';
import { RegisterHandler } from '../decorators/register-handler.decorator';
import {
  AckStatus,
  Actor,
  WACIMessage,
  WACIMessageHandler,
  WACIMessageHandlerResponse,
  WACIMessageResponseType,
  WACIMessageType,
} from '../../types';
import {
  extractExpectedChallenge,
  createUUID,
  verifyPresentation,
} from '../../utils';
import { callbacks } from '../../callbacks';
import { ProblemReportMessage } from '../../types/problem-report';

@RegisterHandler(Actor.Verifier, WACIMessageType.PresentProof)
export class PresentProofHandler implements WACIMessageHandler {
  async handle(
    messageThread: WACIMessage[],
  ): Promise<WACIMessageHandlerResponse> {
    const messageToProcess = messageThread[messageThread.length - 1];

    const holderDID = messageToProcess.from;
    const verifierDID = messageToProcess.to[0];

    const problemReport = new ProblemReportMessage();
    const requestPresentationMessage = messageThread.find(
      (message) => message.type === WACIMessageType.RequestPresentation,
    );

    const response = {
      responseType: WACIMessageResponseType.ReplyThread,
      message: {
        type: WACIMessageType.PresentationAck,
        id: createUUID(),
        thid: messageToProcess.thid,
        from: verifierDID,
        to: [holderDID],
        body: { status: undefined },
      },
    };

    const challengeToCheck = extractExpectedChallenge(
      requestPresentationMessage,
    );

    const presentation = messageToProcess?.attachments?.[0]?.data?.json;

    const verifyPresentationResult = await callbacks[
      Actor.Verifier
    ].verifyPresentation({ presentation, challenge: challengeToCheck });

    if (!verifyPresentationResult.result) {
      //TO DO error codes from vc suite
      return {
        responseType: WACIMessageResponseType.ReplyThread,
        message: {
          type: WACIMessageType.ProblemReport,
          id: createUUID(),
          thid: messageToProcess.id,
          from: verifierDID,
          to: [holderDID],
          body: problemReport.presentProofMessage(
            verifyPresentationResult.error.name,
            verifyPresentationResult.error.description,
          ),
        },
      };
    }

    const requests = requestPresentationMessage.attachments.filter(
      (attachment) => !isNil(attachment.data.json.presentation_definition),
    );

    const submissionsToCheck = requests
      .filter((request) => !isNil(request?.data?.json?.presentation_definition))
      .map((request) => ({
        presentationDefinition: request.data.json.presentation_definition,
        submission: messageToProcess.attachments.find(
          (attachment) =>
            attachment.data.json.presentation_submission.definition_id ===
            request.data.json.presentation_definition.id,
        ),
      }));

    let result = false;

    const verificationResultCallback = callbacks[Actor.Verifier].credentialVerificationResult;
    let vcs = [];

    if (
      submissionsToCheck.every(
        (submissionToCheck) => !isNil(submissionToCheck.submission),
      )
    ) {
      for await (const submissionToCheck of submissionsToCheck) {

        let verify = await verifyPresentation(
          submissionToCheck.presentationDefinition,
          submissionToCheck.submission,
          callbacks[Actor.Verifier].verifyCredential
        );

        result = verify.result;

        for (let vc of verify.vcs) {
          vcs.push(vc);
        }

        if (!result) {

          if (verificationResultCallback) {
            verificationResultCallback({
              result: verify.result,
              error: verify.erorrs,
              thid: messageToProcess.thid,
              vcs: verify.vcs,
              message: messageToProcess,
            })
          }

          return {
            responseType: WACIMessageResponseType.ReplyThread,
            message: {
              type: WACIMessageType.ProblemReport,
              id: createUUID(),
              thid: messageToProcess.id,
              from: verifierDID,
              to: [holderDID],
              body: problemReport.presentProofMessage(
                verify.error.name,
                verify.error.description,
              ),
            },
          };
        }
      }

      if (result) {
        if (verificationResultCallback) {
          verificationResultCallback({
            result: result,
            error: null,
            thid: messageToProcess.thid,
            vcs: vcs,
            message: messageToProcess,
          })
        }

        response.message.body.status = AckStatus.Ok;
        return response;
      }
    }
  }
}
