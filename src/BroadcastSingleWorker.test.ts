import { describe, expect, jest, test } from '@jest/globals';

import BroadcastSingleWorker from './BroadcastSingleWorker';

const sleep = (time = 500) => new Promise((r) => setTimeout(r, time));

describe('breadocast single worker', () => {
    test('sending start-worker event when connecting', () => {
        const worker = new BroadcastSingleWorker('worker');
        const startCallback = jest.fn();

        worker.addListener('start-worker', startCallback);
        worker.connect();

        expect(startCallback).toBeCalledTimes(1);
        expect(worker.isMainWorker()).toBe(true);

        worker.removeAllListeners();
    });

    test('send stop-worker event when disconnecting', () => {
        const worker = new BroadcastSingleWorker('worker');
        const stopCallback = jest.fn();

        worker.addListener('stop-worker', stopCallback);
        worker.connect();
        worker.disconnect();

        expect(stopCallback).toBeCalledTimes(1);
        expect(worker.isMainWorker()).toBe(false);
        
        worker.removeAllListeners();
    });

    test('stop worker when new worker started', async() => {
        const worker1 = new BroadcastSingleWorker('worker');
        const worker2 = new BroadcastSingleWorker('worker');

        const stopCallback = jest.fn();
        worker1.addListener('stop-worker', stopCallback);
        worker1.connect();
        worker2.connect();

        await sleep(500);

        // ToDo: Maybe Mock BroadcastChannel, so we dont need to wait
        expect(stopCallback).toBeCalledTimes(1);
        expect(worker1.isMainWorker()).toBe(false);
        expect(worker2.isMainWorker()).toBe(true);
        worker1.removeAllListeners();
    });

    test('start worker again when main/last worker is disconnected', async () => {
        const worker1 = new BroadcastSingleWorker('worker');
        const worker2 = new BroadcastSingleWorker('worker');
        const startCallback = jest.fn();

        worker1.addListener('start-worker', startCallback);
        worker1.connect();
        worker2.connect();
        worker2.disconnect();
        
        await sleep(500);

        // ToDo: Maybe Mock BroadcastChannel, so we dont need to wait
        expect(startCallback).toBeCalledTimes(2);
        expect(worker1.isMainWorker()).toBe(true);
        expect(worker2.isMainWorker()).toBe(false);

        worker1.removeAllListeners();
    });
});
