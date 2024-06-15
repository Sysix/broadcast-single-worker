export enum SingleWorkerPayloadType {
    CONNECT = 0,
    DISCONNECT = 1
}

export type SingleWorkerPayload = {
    type: SingleWorkerPayloadType;
    workerId: string;
};
