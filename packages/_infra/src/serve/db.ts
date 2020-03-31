import cdk = require('@aws-cdk/core');
import dynamoDb = require('@aws-cdk/aws-dynamodb');
import { Const } from '@basemaps/lambda-shared';

export class TileMetadataTable extends cdk.Construct {
    public table: dynamoDb.Table;
    public constructor(scope: cdk.Construct, id: string) {
        super(scope, id);

        this.table = new dynamoDb.Table(this, 'TileMetadataDynamoTable', {
            tableName: Const.TileMetadata.TableName,
            billingMode: dynamoDb.BillingMode.PAY_PER_REQUEST,
            partitionKey: { name: 'id', type: dynamoDb.AttributeType.STRING },
        });

        new cdk.CfnOutput(this, 'TileMetadataTable', { value: this.table.tableArn });
    }
}
