import { Stack } from '@aws-cdk/core';
import * as AWS from 'aws-sdk';

export const Parameters = {
    Edge: {
        DistributionId: {
            name: 'cloudFrontDistributionId',
            // key: '/basemaps/edge/distributionId',
            cfnOutput: 'CloudFrontDistributionId',
        },
        LogBucketName: {
            name: 'cloudFrontLogBucketName',
            // key: '/basemaps/edge/logBucketName',
            cfnOutput: 'CloudFrontLogBucket',
        },
    },
} as const;

export interface ParametersEdge {
    cloudFrontDistributionId: string;
    cloudFrontLogBucketName: string;
}
/**
 * Because cloudfront configuration has to be in US-East-1
 * We have to mirror cloudformation outputs into the Basemaps region of choice
 *
 * This function will lookup the configuration output from the `Edge` stack and provide them to following stacks
 */
export async function getEdgeParameters(edge: Stack): Promise<null | ParametersEdge> {
    const cfUsEast1 = new AWS.CloudFormation({ region: 'us-east-1' });
    const edgeStack = await cfUsEast1.describeStacks({ StackName: edge.stackName }).promise();
    if (edgeStack == null) {
        console.log('Failed to lookup edge stack.. has it been deployed?');
        return null;
    }

    const output: Partial<ParametersEdge> = {};
    for (const param of Object.values(Parameters.Edge)) {
        const edgeParam = edgeStack.Stacks?.[0].Outputs?.find((f) => f.OutputKey == param.cfnOutput)?.OutputValue;
        if (edgeParam == null) {
            console.log(`Failed to find cfnOutput for ${param.cfnOutput}`);
            continue;
        }

        output[param.name] = edgeParam;
    }
    if (Object.keys(output).length > 1) return output as ParametersEdge;
    return null;
}
