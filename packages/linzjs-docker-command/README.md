## @linzjs/docker-command

Run a command in either docker or on you local system

```typescript
import { Command } from '@linzjs/docker-command';

const cmd = new Command('echo', { container: 'ubuntu', tag: 'latest' });

// Spawn a docker container and run `echo hello world`
await cmd.create().arg('Hello World').run(); // {stdout: "Hello World\n"}
// Spawn a echo process and run `echo hello world`
await cmd.create({ useDocker: false }).arg('Hello World').run(); // {stdout: "Hello World\n"}
```

## Mounting folders in docker

folders can be mounted into the docker container volumes with `.mount`

`.mount(path)` will create a single `--volume path:path`

```typescript
import { Command } from '@linzjs/docker-command';

const proc = await Command.create('ls', { container: 'ubuntu' });
proc.mount('/home/blacha');
proc.arg('/home/blacha');

await proc.run(); // ls results for local /home/blacha
```

## Passing environment variables

```typescript
import { Command } from '@linzjs/docker-command';

const proc = await Command.create('env', { container: 'ubuntu' });
proc.env('AWS_ACCESS_KEY_ID'); // Load process.env.AWS_ACCESS_KEY_ID into docker
proc.env('AWS_ACCESS_KEY_ID', 'fakeKey'); // set a specific AWS_ACCESS_KEY_ID into docker
```
