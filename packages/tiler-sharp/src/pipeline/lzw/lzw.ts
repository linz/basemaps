// taken from https://github.com/geotiffjs/geotiff.js/blob/master/src/compression/lzw.js
// MIT License (MIT)
// Copyright (c) 2015 EOX IT Services GmbH

const MinBits = 9;
const ClearCode = 256; // clear code
const EoiCode = 257; // end of information
const MaxByteLength = 12;

function getByte(array: Uint8Array, position: number, length: number): number {
  const d = position % 8;
  const a = Math.floor(position / 8);
  const de = 8 - d;
  const ef = position + length - (a + 1) * 8;
  let fg = 8 * (a + 2) - (position + length);
  const dg = (a + 2) * 8 - position;
  fg = Math.max(0, fg);
  if (a >= array.length) {
    console.warn('ran off the end of the buffer before finding EOI_CODE (end on input code)');
    return EoiCode;
  }
  let chunk1 = array[a] & (2 ** (8 - d) - 1);
  chunk1 <<= length - de;
  let chunks = chunk1;
  if (a + 1 < array.length) {
    let chunk2 = array[a + 1] >>> fg;
    chunk2 <<= Math.max(0, length - dg);
    chunks += chunk2;
  }
  if (ef > 8 && a + 2 < array.length) {
    const hi = (a + 3) * 8 - (position + length);
    const chunk3 = array[a + 2] >>> hi;
    chunks += chunk3;
  }
  return chunks;
}

function appendReversed(dest: number[], source: number[]): number[] {
  for (let i = source.length - 1; i >= 0; i--) {
    dest.push(source[i]);
  }
  return dest;
}

export function decompress(input: ArrayBuffer): Uint8Array {
  const dictionaryIndex = new Uint16Array(4093);
  const dictionaryChar = new Uint8Array(4093);
  for (let i = 0; i <= 257; i++) {
    dictionaryIndex[i] = 4096;
    dictionaryChar[i] = i;
  }
  let dictionaryLength = 258;
  let byteLength = MinBits;
  let position = 0;

  function initDictionary(): void {
    dictionaryLength = 258;
    byteLength = MinBits;
  }
  function getNext(array: Uint8Array): number {
    const byte = getByte(array, position, byteLength);
    position += byteLength;
    return byte;
  }
  function addToDictionary(i: number, c: number): number {
    dictionaryChar[dictionaryLength] = c;
    dictionaryIndex[dictionaryLength] = i;
    dictionaryLength++;
    return dictionaryLength - 1;
  }
  function getDictionaryReversed(n: number): number[] {
    const rev = [];
    for (let i = n; i !== 4096; i = dictionaryIndex[i]) {
      rev.push(dictionaryChar[i]);
    }
    return rev;
  }

  const result = [];
  initDictionary();
  const array = new Uint8Array(input);
  let code = getNext(array);
  let oldCode: number | undefined;
  while (code !== EoiCode) {
    if (code === ClearCode) {
      initDictionary();
      code = getNext(array);
      while (code === ClearCode) {
        code = getNext(array);
      }

      if (code === EoiCode) {
        break;
      } else if (code > ClearCode) {
        throw new Error(`corrupted code at scanline ${code}`);
      } else {
        const val = getDictionaryReversed(code);
        appendReversed(result, val);
        oldCode = code;
      }
    } else if (code < dictionaryLength) {
      const val = getDictionaryReversed(code);
      appendReversed(result, val);
      addToDictionary(oldCode as number, val[val.length - 1]);
      oldCode = code;
    } else {
      const oldVal = getDictionaryReversed(oldCode as number);
      if (!oldVal) {
        throw new Error(`Bogus entry. Not in dictionary, ${oldCode} / ${dictionaryLength}, position: ${position}`);
      }
      appendReversed(result, oldVal);
      result.push(oldVal[oldVal.length - 1]);
      addToDictionary(oldCode as number, oldVal[oldVal.length - 1]);
      oldCode = code;
    }

    if (dictionaryLength + 1 >= 2 ** byteLength) {
      if (byteLength === MaxByteLength) {
        oldCode = undefined;
      } else {
        byteLength++;
      }
    }
    code = getNext(array);
  }
  return new Uint8Array(result);
}
