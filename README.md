# breadcast-single-worker

## Setup

Install with npm:

`npm install @sysix/broadcast-single-worker`

Use it in your code:

```typescript
import BreadcastSingleWorker from '@sysix/broeadcast-single-worker';

const worker = new BreadcastSingleWorker('channel_name');

worker.addListener('start-worker', () => {
    // this code will only be executed for a single tab
});

worker.addListener('stop-worker', () => {
    // maybe you need to reset some listeners or timeouts
});

// connect to worker to the channel, other browser tab will be notified
// this will trigger start-worker event for the current tab
// this will tigger stop-worker event for the other tab with has the main worker
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
import BreadcastSingleWorker from 'broeadcast-single-worker';

const worker = new BreadcastSingleWorker('channel_name');
const UIChannel = new BreadcastChannel('channel_name_ui');
let intervalId: number | undefined;

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

UIChannel.onmessage = (json: unkown) => {
    updateUi(json);
}

worker.connect();
```