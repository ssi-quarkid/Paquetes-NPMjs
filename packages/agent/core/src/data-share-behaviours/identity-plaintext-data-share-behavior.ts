import { IdentityDataShareBehavior, IdentityExportParams, IdentityExportResult } from "./identity-data-share-behavior";

export class IdentityPlainTextDataShareBehavior implements IdentityDataShareBehavior {

    async export(exportParams: IdentityExportParams): Promise<IdentityExportResult> {
        return {
            data: JSON.stringify(exportParams),
            type: "plain-text",
        };
    }

    async import(exportResult: IdentityExportResult): Promise<IdentityExportParams> {
        return JSON.parse(exportResult.data);
    }

}