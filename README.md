# broadcast-single-worker

![test](https://github.com/Sysix/broadcast-single-worker/actions/workflows/test.yml/badge.svg)
[![NPM Version](https://img.shields.io/npm/v/%40sysix%2Fbroadcast-single-worker)](https://www.npmjs.com/package/@sysix/broadcast-single-worker)
[![NPM License](https://img.shields.io/npm/l/%40sysix%2Fbroadcast-single-worker)](https://www.npmjs.com/package/@sysix/broadcast-single-worker)

## Setup

Install with npm:

`npm install @sysix/broadcast-single-worker`

Use it in your code:

```typescript
import BroadcastSingleWorker from '@sysix/broadcast-single-worker';

const worker = new BroadcastSingleWorker('channel_name');

worker.addListener('start-worker', () => {
    // this code will only be executed for a single tab
});

worker.addListener('stop-worker', () => {
    // maybe you need to reset some listeners or timeouts
});

// connect to worker to the channel, other browser tab will be notified
// this will trigger start-worker event for the current tab
// this will trigger stop-worker event for the other tab with has the main worker
worker.connect();

// when you no longer want to listen for other tabs
// this will also tell other tabs that maybe they need to be the main worker
worker.disconnect();
```


## Why?

One of my projects needs to poll from the server in a small interval.  
When multiple tabs are connected to the server, then every tab starts a request after the interval is reached.

This library makes it possible to reduce server requests with this following example:

```typescript 
import BroadcastSingleWorker from '@sysix/broadcast-single-worker';

const worker = new BroadcastSingleWorker('channel_name');
const UIChannel = new BroadcastChannel('channel_name_ui');
let intervalId: number | undefined;

const updateUi = (json: unknown) => {
  document.body.innerText = JSON.stringify(json);
}

worker.addListener('start-worker', () => {
    intervalId = window.setInterval(async () => {
        const response = await window.fetch('https://host/poll-ui-changes');
        const json = await response.json();

        updateUi(json);
        UIChannel.postMessage(json);
    }, 30000);
});

worker.addListener('stop-worker', () => {
    if (intervalId) {
        window.clearInterval(intervalId);
    }
});

UIChannel.onmessage = (message: MessageEvent<unknown>) => {
    updateUi(message.data);
}

worker.connect();
```