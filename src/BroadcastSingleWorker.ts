import { EventEmitter } from 'eventemitter3';
import { SingleWorkerPayload, SingleWorkerPayloadType } from './SingleWorkerPayload';

export default class BroadcastSingleWorker extends EventEmitter<'start-worker' | 'stop-worker', never> {

    #channelName: string;

    #channel: BroadcastChannel | undefined;

    #workerId: string;

    #otherWorkerIds: string[] = [];

    #unloadCallback = this.disconnect.bind(this);

    constructor(channelName: string) {
        super();

        this.#channelName = channelName;
        this.#workerId = window.crypto.randomUUID();
    }
    /**
     * connect to the broadcast channel and tell other tabs that we exists
     */
    connect(): void {
        // already connected
        if (this.#channel) {
            return;
        }

        this.#channel = new window.BroadcastChannel(this.#channelName);
        this.#channel.addEventListener('message', this.#onMessage.bind(this));

        // tell other tabs we are connecting
        this.#postMessage({
            type: SingleWorkerPayloadType.CONNECT,
            workerId: this.#workerId
        });

        // tell the current tab to start their job
        this.emit('start-worker');

        // listen for unload event
        window.addEventListener('unload', this.#unloadCallback);
    }
    /**
     * disconnect to the broadcast channel and tell other tabs
     */
    disconnect(): void {
        // we are not connected
        if (!this.#channel) {
            return;
        }

        // tell the other tabs that we want to disconnect
        this.#postMessage({
            type: SingleWorkerPayloadType.DISCONNECT,
            workerId: this.#workerId
        })

        // tell the current tab to stop their job
        if (this.isActiveWorker()) {
            this.emit('stop-worker');
        }

        // close channel
        this.#channel.close();
        this.#channel = undefined;

        // don't listen to the unload event
        window.removeEventListener('unload', this.#unloadCallback);
    }

    /**
    * is the current tab the currently worker?
    */
    isActiveWorker(): boolean {
        return this.#channel !== undefined && this.#otherWorkerIds.length === 0;
    }

    /**
     * BroadcastChannel.postMessage with strict TS Type
     */
    #postMessage(payload: SingleWorkerPayload): void {
        if (!this.#channel) {
            return;
        }

        this.#channel.postMessage(payload);
    }

    /**
     * remove the worker id from known other worker ids
     */
    #removeOtherWorkerId(workerId: string): void {
        const index = this.#otherWorkerIds.findIndex(otherId => otherId === workerId);

        if (index !== -1) {
            this.#otherWorkerIds.splice(index, 1);
        }
    }

    /**
     * Handle the messages from other tabs
     */
    #onMessage(event: MessageEvent<SingleWorkerPayload>): void {

        // other tabs want to connect
        // newer connections have most likly more accurate data
        if (event.data.type === SingleWorkerPayloadType.CONNECT) {

            // tell the current tab to stop their job
            if (this.isActiveWorker()) {
                this.emit('stop-worker');
            }

            this.#otherWorkerIds.push(event.data.workerId);
        }

        // other tab want to disconnect
        // check if we should be now the main worker
        if (event.data.type === SingleWorkerPayloadType.DISCONNECT) {
            const isCurrentActiveWorker = this.isActiveWorker();

            this.#removeOtherWorkerId(event.data.workerId);

            // we are the main worker now, tell the current tab to start the job
            if (!isCurrentActiveWorker && this.isActiveWorker()) {
                this.emit('start-worker');
            }
        }
    }
}
