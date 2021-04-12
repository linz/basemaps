// import DynamoDB from 'aws-sdk/clients/dynamodb';
// import o from 'ospec';
// import { Const } from '../../const';
// import { TileMetadataTable } from '../tile.metadata';

// o.spec('tile.metadata', () => {
//     o('asyncIterator', async () => {
//         const recs: any[] = [
//             { id: 'im_rec1', name: 'rec1' },
//             { id: 'ts_rec2', name: 'rec2' },
//             { id: 'ts_rec3', name: 'rec3' },
//         ];
//         const dynamo = {
//             scan(opts: any): any {
//                 return {
//                     async promise(): Promise<any> {
//                         if (opts.TableName !== Const.TileMetadata.TableName) {
//                             throw new Error('Wrong table name: ' + opts.TableName);
//                         }
//                         let sample = recs.slice(0);
//                         let lastKey: any = null;
//                         if (opts.ExclusiveStartKey === undefined) {
//                             sample = recs.slice(0, 1);
//                             lastKey = 'ts_rec2';
//                         } else if (opts.ExclusiveStartKey === 'ts_rec2') {
//                             sample = recs.slice(1);
//                         }
//                         return {
//                             Items: sample.map((r) => DynamoDB.Converter.marshall(r)),
//                             LastEvaluatedKey: lastKey,
//                         };
//                     },
//                 };
//             },
//         } as DynamoDB;

//         const table = new TileMetadataTable();
//         table.dynamo = dynamo;

//         const ans = [];

//         for await (const item of table) {
//             ans.push(item);
//         }

//         o(ans).deepEquals(recs);
//     });
// });
// FIXME
