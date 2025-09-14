import { Agent, CredentialFlow, DID } from "../../src";

const credentialIssueForNotOperationalDID = async (holderAgent: Agent, issuerAgent: Agent) => {
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
                    expect(vc.credentials[0].data.proof.verificationMethod.indexOf("did:quarkid:zksync:EiAJcbMpo4OPpisPfqtv8O5_d7ABI1D23ehx2quLhqqIdw") > -1);
                    resolve(null);
                }))
            });

            issuerAgent.vc.ackCompleted.on((args) => {
                console.log(args);
            });

            issuerAgent.vc.presentationVerified.on((args) => {
                console.log(args);
            });

            await holderAgent.vc.processMessage({
                did: DID.from("did:quarkid:zksync:EiAg5whxpppkIBbmLgzUBxssjNsF2fRZxYmO4bq6t5s-DQ"),
                message: await issuerAgent.vc.createInvitationMessage({
                    flow: CredentialFlow.Issuance,
                    did: DID.from("did:quarkid:zksync:EiAJcbMpo4OPpisPfqtv8O5_d7ABI1D23ehx2quLhqqIdw")
                }),
            });
        });

    await processMessage();
}

export { credentialIssueForNotOperationalDID };