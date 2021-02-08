import o from 'ospec';
import { Command } from '../../command';
import { toDockerExecution } from '../execute.docker';

o.spec('DockerExecution', () => {
    o('should run hello world', () => {
        const cmd = Command.create('echo', { container: 'ubuntu' }).arg('hello world');
        o(toDockerExecution(cmd).toCommand()).equals(`docker run --rm ubuntu echo hello world`);
    });

    o('should mount folders', () => {
        const cmd = Command.create('echo', { container: 'ubuntu' }).arg('hello world');
        cmd.mount('/home');

        o(toDockerExecution(cmd).toCommand()).equals(`docker run --rm --volume /home:/home ubuntu echo hello world`);
    });

    o('should not mount duplicate folders', () => {
        const cmd = Command.create('echo', { container: 'ubuntu' }).arg('hello world');
        cmd.mount('/home');
        cmd.mount('/home');
        o(toDockerExecution(cmd).toCommand()).equals(`docker run --rm --volume /home:/home ubuntu echo hello world`);
    });

    o('should mount env vars', () => {
        const cmd = Command.create('echo', { container: 'ubuntu' }).arg('hello world');
        cmd.env('AWS_ACCESS_KEY', 'fakeKey');
        o(toDockerExecution(cmd).toCommand()).equals(
            `docker run --rm --env AWS_ACCESS_KEY=fakeKey ubuntu echo hello world`,
        );
    });

    o('should pass through env vars', () => {
        const cmd = Command.create('echo', { container: 'ubuntu' }).arg('hello world');
        cmd.env('AWS_ACCESS_KEY');
        o(toDockerExecution(cmd).toCommand()).equals(`docker run --rm --env AWS_ACCESS_KEY ubuntu echo hello world`);
    });
});
