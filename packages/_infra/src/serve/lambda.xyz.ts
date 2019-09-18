import cdk = require('@aws-cdk/core');
import iam = require('@aws-cdk/aws-iam');
import lambda = require('@aws-cdk/aws-lambda');
import dynamoDb = require('@aws-cdk/aws-dynamodb');
import { RetentionDays } from '@aws-cdk/aws-logs';
import { Const } from '@basemaps/shared';
import { VersionUtil } from '../version';
import { ApiKeyTableArn } from '../api.key.db';

const CODE_PATH = '../lambda-xyz/dist';
/**
 * Create a API Key validation edge lambda
 */
export class LambdaXyz extends cdk.Construct {
    public lambda: lambda.Function;
    public version: lambda.Version;

    public constructor(scope: cdk.Stack, id: string) {
        super(scope, id);

        this.lambda = new lambda.Function(this, 'Tiler', {
            runtime: lambda.Runtime.NODEJS_8_10,
            handler: 'index.handler',
            code: lambda.Code.asset(CODE_PATH),
            logRetention: RetentionDays.ONE_MONTH,
        });

        // CloudFront requires a specific version for a lambda,
        // so using a hash of the source code create a version
        this.version = this.lambda.addVersion(':sha256:' + VersionUtil.hash(CODE_PATH));

        // Output the edge lambda's ARN
        new cdk.CfnOutput(this, 'LambdaXyz', {
            value: cdk.Fn.join(':', [this.lambda.functionArn, this.version.version]),
        });
    }
}
