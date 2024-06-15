import { describe, expect, jest, test } from '@jest/globals';
import crypto from 'node:crypto';
import { BroadcastChannel } from 'node:worker_threads';
import BroadcastSingleWorker from './BroadcastSingleWorker';

const sleep = (time: number) => new Promise((r) => setTimeout(r, time));

Object.defineProperty(window, 'crypto', {
    get() {
        return crypto.webcrypto
    }
})

Object.defineProperty(window, 'BroadcastChannel', {
    get() {
        return BroadcastChannel
    }
})

describe('breadocast single worker', () => {
    test('fire start-worker event when connecting', () => {
        const worker = new BroadcastSingleWorker('worker');
        const startCallback = jest.fn();

        worker.addListener('start-worker', startCallback);
        worker.connect();

        expect(startCallback).toBeCalledTimes(1);
        expect(worker.isMainWorker()).toBe(true);

        worker.removeAllListeners();
        worker.disconnect();
    });

    test('fire stop-worker event when disconnecting', () => {
        const worker = new BroadcastSingleWorker('worker');
        const stopCallback = jest.fn();

        worker.addListener('stop-worker', stopCallback);
        worker.connect();
        worker.disconnect();

        expect(stopCallback).toBeCalledTimes(1);
        expect(worker.isMainWorker()).toBe(false);

        worker.removeAllListeners();
    });

    test('stop worker when new worker started', async () => {
        const worker1 = new BroadcastSingleWorker('worker');
        const worker2 = new BroadcastSingleWorker('worker');

        const stopCallback = jest.fn();
        worker1.addListener('stop-worker', stopCallback);
        worker1.connect();
        worker2.connect();

        // ToDo: Maybe Mock BroadcastChannel, so we dont need to wait
        await sleep(10);

        expect(stopCallback).toBeCalledTimes(1);
        expect(worker1.isMainWorker()).toBe(false);
        expect(worker2.isMainWorker()).toBe(true);

        worker1.removeAllListeners();
        worker1.disconnect();
        worker2.disconnect();
    });

    test('start worker again when main/last worker is disconnected', async () => {
        const worker1 = new BroadcastSingleWorker('worker');
        const worker2 = new BroadcastSingleWorker('worker');
        const startCallback = jest.fn();

        worker1.addListener('start-worker', startCallback);
        worker1.connect();
        worker2.connect();
        worker2.disconnect();

        // ToDo: Maybe Mock BroadcastChannel, so we dont need to wait
        await sleep(10);

        expect(startCallback).toBeCalledTimes(2);
        expect(worker1.isMainWorker()).toBe(true);
        expect(worker2.isMainWorker()).toBe(false);

        worker1.removeAllListeners();
        worker1.disconnect();
    });

    test('disconnect channel and worker when window is closing', async () => {
        const worker = new BroadcastSingleWorker('worker');
        const stopCallback = jest.fn();
        
        worker.addListener('stop-worker', stopCallback);
        worker.connect();

        window.dispatchEvent(new Event('beforeunload'));

        // ToDo: Maybe Mock BroadcastChannel, so we dont need to wait
        await sleep(100);

        expect(stopCallback).toBeCalledTimes(1);
        expect(worker.isMainWorker()).toBe(false);

        worker.removeAllListeners();
    });

    test('do not fire start-worker event when non main worker disconnect', async () => {
        const worker1 = new BroadcastSingleWorker('worker');
        const worker2 = new BroadcastSingleWorker('worker');
        const startCallback = jest.fn();

        worker2.addListener('start-worker', startCallback);
        worker1.connect();
        worker2.connect();
        worker1.disconnect();

        // ToDo: Maybe Mock BroadcastChannel, so we dont need to wait
        await sleep(10);

        expect(startCallback).toBeCalledTimes(1);
        expect(worker1.isMainWorker()).toBe(false);
        expect(worker2.isMainWorker()).toBe(true);

        worker2.removeAllListeners();
        worker2.disconnect();
    })
});
