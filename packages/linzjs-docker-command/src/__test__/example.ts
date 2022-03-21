import { Command } from '../command.js';

const echo = new Command('echo', { container: 'ubuntu' });

async function main(): Promise<void> {
  const res = await echo.create().arg('Hello world').run();
  console.log(res.command.toCommand(), { duration: res.duration });

  const resLocal = await echo.create({ useDocker: false }).arg('Hello world').run();
  console.log(resLocal.command.toCommand(), { duration: resLocal.duration });
}

main();
