import cdk = require('@aws-cdk/core');
import dynamoDb = require('@aws-cdk/aws-dynamodb');
import { Const } from '@basemaps/shared';

/**
 * We need the API Key table to deployed in ap-southeast-2 Lambda@Edge has to be deployed in us-east-1
 * which makes this deployment process tricky
 *
 *  - Deploy the table separately from the lambda
 *  - Link the table to the lambda using the ARN
 */
export class ApiKeyTableStack extends cdk.Stack {
    public table: dynamoDb.Table;
    public constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        this.table = new dynamoDb.Table(this, 'Table', {
            tableName: Const.ApiKey.TableName,
            billingMode: dynamoDb.BillingMode.PAY_PER_REQUEST,
            partitionKey: { name: 'id', type: dynamoDb.AttributeType.STRING },
            pointInTimeRecovery: true,
        });
    }
}

export const ApiKeyTableArn = {
    /**
     * get the ARN for the API Key table,
     * as it is needed across regions
     *
     * @returns ARN of the API Key table
     */
    getArn(scope: cdk.Stack): string {
        return cdk.Arn.format(
            {
                service: 'dynamodb',
                region: '*',
                resource: 'table',
                resourceName: Const.ApiKey.TableName,
            },
            scope,
        );
    },
};
