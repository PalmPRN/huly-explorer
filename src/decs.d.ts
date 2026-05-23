declare module '@hcengineering/api-client' {
  export interface WorkspaceToken {
    endpoint: string;
    token: string;
    workspaceId: string;
    info?: any;
  }

  export interface HulyClient {
    findAll(className: string, query: any, options?: any): Promise<any[] & { total?: number }>;
    findOne(className: string, query: any, options?: any): Promise<any | undefined>;
    createDoc(className: string, spaceId: string, attributes: any, id?: string): Promise<string>;
    updateDoc(className: string, spaceId: string, objectId: string, operations: any, retrieve?: boolean): Promise<any>;
    removeDoc(className: string, spaceId: string, objectId: string): Promise<any>;
    close(): Promise<void>;
    getAccount(): Promise<any>;
    getModel(): Promise<{ hierarchy: any; model: any }>;
  }

  export function connect(url: string, options: any): Promise<HulyClient>;
  export function connectRest(url: string, options: any): Promise<HulyClient>;
  export function createRestTxOperations(
    endpoint: string,
    workspaceId: string,
    token: string,
    fullModel?: boolean
  ): Promise<HulyClient>;
  export function getWorkspaceToken(
    url: string,
    options: any,
    config?: any
  ): Promise<WorkspaceToken>;
}
