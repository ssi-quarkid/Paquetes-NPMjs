import { Agent } from "../agent";
/**
 * Interfaz para los plugins de interceptación del flujo de credenciales verificables (VC).
 */
export interface AgentPluginBase {
    initialize(params: {
        agent: Agent;
    }): Promise<void>;
}
