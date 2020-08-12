# S3 FS

Utility functions for working with files that could either reside on the local file system or inside s3

## Usage

```typescript
import { S3Fs } from '@linzjs/s3fs';

const fs = new S3Fs();

const files = await fs.list('s3://foo/bar');
// ['s3://foo/bar/baz.html', 's3://foo/bar/index.html']

const filesLocal = await fs.list('/home/blacha')
// ['/home/blacha/index.html]
```