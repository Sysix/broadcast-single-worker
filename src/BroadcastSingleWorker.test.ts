import { describe, expect, jest, test } from '@jest/globals';
import { webcrypto } from 'node:crypto';
import { BroadcastChannel } from 'node:worker_threads';
import BroadcastSingleWorker from './BroadcastSingleWorker';

const sleep = (time: number) => new Promise((r) => setTimeout(r, time));

Object.defineProperty(window, 'crypto', {
    get() {
        return webcrypto
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
        expect(worker.isActiveWorker()).toBe(true);

        worker.removeAllListeners();
        worker.disconnect();
    });

    test('fire stop-worker event when disconnecting', () => {
        const worker = new BroadcastSingleWorker('worker');
        const stopCallback = jest.fn();

        expect(worker.isActiveWorker()).toBe(false);

        worker.addListener('stop-worker', stopCallback);
        worker.connect();
        worker.disconnect();

        expect(stopCallback).toBeCalledTimes(1);
        expect(worker.isActiveWorker()).toBe(false);

        worker.removeAllListeners();
    });

    test('fire stop-worker event when new worker started', async () => {
        const worker1 = new BroadcastSingleWorker('worker');
        const worker2 = new BroadcastSingleWorker('worker');

        const stopCallback = jest.fn();
        worker1.addListener('stop-worker', stopCallback);
        worker1.connect();
        worker2.connect();

        // ToDo: Maybe Mock BroadcastChannel, so we dont need to wait
        await sleep(10);

        expect(stopCallback).toBeCalledTimes(1);
        expect(worker1.isActiveWorker()).toBe(false);
        expect(worker2.isActiveWorker()).toBe(true);

        worker1.removeAllListeners();
        worker1.disconnect();
        worker2.disconnect();
    });

    test('fire start-worker event again when main/last worker is disconnected', async () => {
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
        expect(worker1.isActiveWorker()).toBe(true);
        expect(worker2.isActiveWorker()).toBe(false);

        worker1.removeAllListeners();
        worker1.disconnect();
    });

    // ToDo: somehow the event listener is not triggered
    test.skip('disconnect channel when window is closing', async () => {
        const worker = new BroadcastSingleWorker('worker');

        const disconnectMock = jest.fn();
        const originalDisconnect = worker.disconnect;

        worker.disconnect = () => {
            originalDisconnect();
            disconnectMock();
        };

        worker.connect();

        window.dispatchEvent(new Event('beforeunload'));

        // ToDo: Maybe Mock BroadcastChannel, so we dont need to wait
        await sleep(100);

        expect(disconnectMock).toBeCalledTimes(1);
        expect(worker.isActiveWorker()).toBe(false);

        worker.removeAllListeners();
    });

    test('don\'t fire start-worker event when non main worker disconnect', async () => {
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
        expect(worker1.isActiveWorker()).toBe(false);
        expect(worker2.isActiveWorker()).toBe(true);

        worker2.removeAllListeners();
        worker2.disconnect();
    })
});
