import { decode } from "base-64";
import { Agent, CredentialFlow } from "../../src";

const credentialPresentation = async (holderAgent: Agent, issuerAgent: Agent) => {
    let outParam: { invitationId: string } = { invitationId: null };
    const message = await issuerAgent.vc.createInvitationMessage({ flow: CredentialFlow.Presentation }, outParam);

    await holderAgent.vc.processMessage({ message })

    const waitCredentialArrived = async () =>
        new Promise(async (resolve, reject) => {
            holderAgent.vc.credentialArrived.on(async (vc) => {
                await Promise.all(vc.credentials.map(async v => {
                    await holderAgent.vc.saveCredentialWithInfo(v.data, {
                        display: v.display,
                        styles: v.styles
                    });

                    // expect(v?.data.id).toEqual('http://example.edu/credentials/58473');

                    // const result = await holderAgent.vc.verifyVC({
                    //     vc: v.data,
                    // });

                    // expect(result.result).toBe(true);
                }))
            });

            holderAgent.vc.problemReport.on((data) => {
                expect(data.invitationId).toEqual(outParam.invitationId)
            });

            holderAgent.vc.ackCompleted.on((args) => {
                expect(args.invitationId).toEqual(outParam.invitationId)
                resolve(null);
            });
        });

    await waitCredentialArrived();
};


export { credentialPresentation };