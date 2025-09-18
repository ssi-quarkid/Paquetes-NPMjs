import { Agent, CredentialFlow } from "../../src";

const credentialIssuance = async (holderAgent: Agent, issuerAgent: Agent) => {
    const processMessage = async () =>
        new Promise(async (resolve, reject) => {
            holderAgent.vc.credentialArrived.on(async (vc) => {
                await Promise.all(vc.credentials.map(async v => {
                    await holderAgent.vc.saveCredentialWithInfo(v.data, {
                        display: v.display,
                        styles: v.styles
                    });
                    expect(v?.data.id).toEqual('http://example.edu/credentials/58473');

                    const result = await holderAgent.vc.verifyVC({
                        vc: v.data,
                    });

                    expect(result.result).toBe(true);
                }))
            });

            issuerAgent.vc.ackCompleted.on((args) => {
                console.log(args);
                resolve(null);
            });

            issuerAgent.vc.presentationVerified.on((args) => {
                console.log(args);
            });

            await holderAgent.vc.processMessage({
                message: await issuerAgent.vc.createInvitationMessage({ flow: CredentialFlow.Issuance }),
            });
        });

    await processMessage();
}

export { credentialIssuance };