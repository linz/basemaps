import { fsa } from '@chunkd/fs';
import o from 'ospec';
import { asyncFilter, chunkArray } from '../action.aws.list.js';

o.spec('chunkArray', () => {
  o('should chunk a array', () => {
    o(chunkArray([1, 2, 3, 4], 2)).deepEquals([
      [1, 2],
      [3, 4],
    ]);
  });

  o('should chunk a set', () => {
    o(chunkArray(new Set([1, 2, 3, 4, 4]), 2)).deepEquals([
      [1, 2],
      [3, 4],
    ]);
  });

  o('should chunk small set', () => {
    o(chunkArray(new Set([1]), 2)).deepEquals([[1]]);
  });

  o('should chunk large set', () => {
    o(chunkArray(new Set([1, 2, 3, 4, 4]), 5)).deepEquals([[1, 2, 3, 4]]);
  });

  o('should chunk into single sets', () => {
    o(chunkArray(new Set([1, 2, 3, 4, 4]), 1)).deepEquals([[1], [2], [3], [4]]);
  });
});

o.spec('asyncFilter', () => {
  const fileList = [
    'a.tiff',
    'B.TIFF',
    '/foo/bar/baz.tiff',
    '/foo/xls.ts',
    'c:\\foo\\bar.txt',
    's3://foo/bar.tiff',
    's3://foo/bar.ts',
    's3://foo/bar/baz.tif',
  ];
  async function* generator(): AsyncGenerator<string> {
    for (const file of fileList) yield file;
  }
  o('should filter all', async () => {
    o(await fsa.toArray(asyncFilter(generator(), '*'))).deepEquals(fileList);
  });

  o('should filter exact', async () => {
    for (const file of fileList) {
      if (file.startsWith('c:\\')) continue; // not a valid regexp
      o(await fsa.toArray(asyncFilter(generator(), file))).deepEquals([file]);
    }
  });

  o('should filter suffix', async () => {
    o(await fsa.toArray(asyncFilter(generator(), '.tiff$'))).deepEquals(
      fileList.filter((f) => f.toLowerCase().endsWith('.tiff')),
    );
  });

  o('should filter tif or tiff', async () => {
    o(await fsa.toArray(asyncFilter(generator(), '.tiff?$'))).deepEquals(
      fileList.filter((f) => f.toLowerCase().endsWith('.tiff') || f.toLowerCase().endsWith('.tif')),
    );
  });
});
