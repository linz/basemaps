# @basemaps/metrics

Simple timing metric tracker for NodeJS

## Usage

```typescript

import { Metrics } from '@basemaps/metrics';

const metrics = new Metrics();

metrics.start('timer');
const duration = metrics.end('timer') // 0.1 (in ms)

const allMetrics = metrics.metrics // { timer: 1e6 }


// Unfinished
metrics.start('timer');

metrics.unfinished // ['timer']
```
