import { AgentPluginNotFound as AgentPluginNotFoundError } from "../exceptions/agent-plugin-not-found";
import { IAgentPlugin, IAgentPluginMessage, IAgentPluginResponse } from "./iplugin";

export class PluginDispatcher {
    private plugins: IAgentPlugin[];

    constructor(plugins: IAgentPlugin[]) {
        this.plugins = plugins;
    }

    public async dispatch(input: IAgentPluginMessage): Promise<IAgentPluginResponse> {
        for (const plugin of this.plugins) {
            if (plugin.canHandle(input)) {
                return await plugin.handle(input);
            }
        }

        // Si llegamos aquí, es porque ningún plugin puede manejar la entrada
        throw new AgentPluginNotFoundError('No plugin was found that can handle the input');
    }
}