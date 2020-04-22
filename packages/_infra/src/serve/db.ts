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

export const TileMetadataTableArn = {
    /**
     * get the ARN for the TileMetadata table
     *
     * @returns ARN of the TileMetadata table
     */
    getArn(scope: cdk.Stack): string {
        return cdk.Arn.format(
            {
                service: 'dynamodb',
                region: '*',
                resource: 'table',
                resourceName: Const.TileMetadata.TableName,
            },
            scope,
        );
    },
};
