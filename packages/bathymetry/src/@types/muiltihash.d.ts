declare module 'multihashes' {
  interface MultiHashStatic {
    encode(buf: Buffer, type: 'sha2-256'): Buffer;
  }
  const multiHash: MultiHashStatic;
  export = multiHash;
}
