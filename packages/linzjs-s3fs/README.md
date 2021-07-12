# S3 FS

Utility functions for working with files that could either reside on the local file system or inside s3

## Usage

```typescript
import { fsa } from '@linzjs/s3fs';

for await (const file of fsa.list('s3://foo/bar')) {
    // ['s3://foo/bar/baz.html', 's3://foo/bar/index.html']
}

for await (const file of fsa.list('/home/blacha')) {
    // '/home/blacha/index.html'
}

// Convert the generator to an array
const files = await fsa.toArray(fsa.list('s3://foo/bar'));
```

This is designed for use with multiple s3 credentials 

```typescript
import {fsa, FsS3} from '@linzjs/s3fs'

const bucketA = new S3({ credentials: bucketACredentials })
const bucketB = new S3({ credentials: bucketBCredentials  })

fsa.register('s3://bucket-a', new FsS3(bucketA))
fsa.register('s3://bucket-b', new FsS3(bucketB))

// Stream a file from bucketA to bucketB
await fsa.write('s3://bucket-b/foo', fsa.readStream('s3://bucket-a/foo'))
```

Or even any s3 compatible api

```typescript
import {fsa, FsS3} from '@linzjs/s3fs'

const bucketA = new S3({ endpoint: 'http://10.0.0.1:8080' })
const bucketB = new S3({ endpoint: 'http://10.0.0.99:8080' })

fsa.register('s3://bucket-a', new FsS3(bucketA))
fsa.register('s3://bucket-b', new FsS3(bucketB))

// Stream a file from bucketA (10.0.0.1) to bucketB (10.0.0.99)
await fsa.write('s3://bucket-b/foo', fsa.readStream('s3://bucket-a/foo'))
```