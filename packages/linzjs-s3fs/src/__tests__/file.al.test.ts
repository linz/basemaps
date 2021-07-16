import o from 'ospec';
import { FileSystemAbstraction } from '../file.al';
import { FsLocal } from '../abstractions/file.local';

export class FakeSystem extends FsLocal {
    constructor(protocol = 'fake') {
        super();
        this.protocol = protocol;
    }
}

o.spec('FileSystemAbstraction', () => {
    o('should find file systems', () => {
        const fsa = new FileSystemAbstraction();

        o(fsa.find('/foo').protocol).equals('file');
        o(fsa.find('/').protocol).equals('file');
    });

    o('should default to local fs', () => {
        const fsa = new FileSystemAbstraction();

        o(fsa.find('file://foo').protocol).equals('file');
        o(fsa.find('s3://bar').protocol).equals('file');
    });

    o('should register new file systems', () => {
        const fsa = new FileSystemAbstraction();

        const fakeLocal = new FakeSystem('fake');
        fsa.register('fake://', fakeLocal);

        o(fsa.find('/').protocol).equals('file');
        o(fsa.find('fake://foo').protocol).equals('fake');
        o(fsa.find('fake:/foo').protocol).equals('file');
        o(fsa.find('fake//foo').protocol).equals('file');
        o(fsa.find('fake').protocol).equals('file');
    });

    o('should find file systems in order they were registered', () => {
        const fakeA = new FakeSystem('fake');
        const fakeB = new FakeSystem('fakeSpecific');
        const fsa = new FileSystemAbstraction();

        fsa.register('fake://', fakeA);
        fsa.register('fake://some-prefix-string/', fakeB);

        o(fsa.find('fake://foo').protocol).equals('fake');
        o(fsa.find('fake://some-prefix-string/').protocol).equals('fakeSpecific');
        o(fsa.find('fake://some-prefix-string/some-key').protocol).equals('fakeSpecific');
    });

    o('should order file systems by length', () => {
        const fakeA = new FakeSystem('fake');
        const fakeB = new FakeSystem('fakeSpecific');
        const fsa = new FileSystemAbstraction();

        fsa.register('fake://some-prefix-string/', fakeB);
        fsa.register('fake://', fakeA);

        o(fsa.find('fake://foo').protocol).equals('fake');
        o(fsa.find('fake://some-prefix-string/').protocol).equals('fakeSpecific');
        o(fsa.find('fake://some-prefix-string/some-key').protocol).equals('fakeSpecific');
    });
});
