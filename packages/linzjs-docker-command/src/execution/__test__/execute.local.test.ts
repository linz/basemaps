import o from 'ospec';
import { Command } from '../../command.js';

o.spec('LocalExecution', () => {
  o('should run hello world', () => {
    const cmd = Command.create('echo', { container: 'ubuntu' }).arg('hello world');
    o(cmd.toCommand()).equals(`echo hello world`);
  });
});
