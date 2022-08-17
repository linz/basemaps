import { fsa } from '@chunkd/fs';
import o from 'ospec';
import { asyncFilter, chunkFiles, FileSizeInfo } from '../action.aws.list.js';

o.spec('chunkFiles', () => {
  o('should chunk a array', () => {
    o(chunkFiles([{ path: '1' }, { path: '2' }, { path: '3' }, { path: '4' }], 2, -1)).deepEquals([
      ['1', '2'],
      ['3', '4'],
    ]);
  });

  o('should chunk small set', () => {
    o(chunkFiles([{ path: '1' }], 2, -1)).deepEquals([['1']]);
  });

  o('should chunk large set', () => {
    o(chunkFiles([{ path: '1' }, { path: '2' }, { path: '3' }, { path: '4' }], 5, -1)).deepEquals([
      ['1', '2', '3', '4'],
    ]);
  });

  o('should chunk into single sets', () => {
    o(chunkFiles([{ path: '1' }, { path: '2' }, { path: '3' }, { path: '4' }], 1, -1)).deepEquals([
      ['1'],
      ['2'],
      ['3'],
      ['4'],
    ]);
  });

  o('should chunk by size', () => {
    o(
      chunkFiles(
        [
          { path: '1', size: 100 },
          { path: '2', size: 200 },
          { path: '3', size: 300 },
          { path: '4', size: 400 },
        ],
        -1,
        300,
      ),
    ).deepEquals([['1', '2'], ['3'], ['4']]);
  });

  o('should chunk by size or count which ever comes first', () => {
    o(
      chunkFiles(
        [
          { path: '1', size: 100 },
          { path: '2', size: 100 },
          { path: '3', size: 100 },
          { path: '4', size: 100 },
          { path: '5', size: 600 },
          { path: '6', size: 600 },
        ],
        2,
        500,
      ),
    ).deepEquals([['1', '2'], ['3', '4'], ['5'], ['6']]);
  });
});

o.spec('asyncFilter', () => {
  const fileList: FileSizeInfo[] = [
    { path: 'a.tiff' },
    { path: 'B.TIFF' },
    { path: '/foo/bar/baz.tiff' },
    { path: '/foo/xls.ts' },
    { path: 'c:\\foo\\bar.txt' },
    { path: 's3://foo/bar.tiff' },
    { path: 's3://foo/bar.ts' },
    { path: 's3://foo/bar/baz.tif' },
  ];
  async function* generator(): AsyncGenerator<FileSizeInfo> {
    for (const file of fileList) yield file;
  }
  o('should filter all', async () => {
    o(await fsa.toArray(asyncFilter(generator(), '*'))).deepEquals(fileList);
  });

  o('should filter exact', async () => {
    for (const file of fileList) {
      if (file.path.startsWith('c:\\')) continue; // not a valid regexp
      o(await fsa.toArray(asyncFilter(generator(), file.path))).deepEquals([file]);
    }
  });

  o('should filter suffix', async () => {
    o(await fsa.toArray(asyncFilter(generator(), '.tiff$'))).deepEquals(
      fileList.filter((f) => f.path.toLowerCase().endsWith('.tiff')),
    );
  });

  o('should filter tif or tiff', async () => {
    o(await fsa.toArray(asyncFilter(generator(), '.tiff?$'))).deepEquals(
      fileList.filter((f) => f.path.toLowerCase().endsWith('.tiff') || f.path.toLowerCase().endsWith('.tif')),
    );
  });
});
