import { Stack } from 'aws-cdk-lib';
import CloudFormation from 'aws-sdk/clients/cloudformation.js';

export interface ParametersEdge {
  CloudFrontBucket: string;
  CloudFrontLogBucket: string;
  CloudFrontDistributionId: string;
}

export const ParametersEdgeKeys: Record<keyof ParametersEdge, string> = {
  CloudFrontBucket: 'CloudFrontBucket',
  CloudFrontLogBucket: 'CloudFrontLogBucket',
  CloudFrontDistributionId: 'CloudFrontDistributionId',
};

/**
 * Because cloudfront configuration has to be in US-East-1
 * We have to mirror cloudformation outputs into the Basemaps region of choice
 *
 * This function will lookup the configuration output from the `Edge` stack and provide them to following stacks
 */
export async function getEdgeParameters(edge: Stack): Promise<null | ParametersEdge> {
  const cfUsEast1 = new CloudFormation({ region: 'us-east-1' });
  const edgeStack = await cfUsEast1.describeStacks({ StackName: edge.stackName }).promise();
  if (edgeStack == null) {
    console.error('Failed to lookup edge stack.. has it been deployed?');
    return null;
  }

  const output: Partial<ParametersEdge> = {};
  for (const param of Object.keys(ParametersEdgeKeys)) {
    const edgeParam = edgeStack.Stacks?.[0].Outputs?.find((f) => f.OutputKey === param)?.OutputValue;
    if (edgeParam == null) {
      console.error(`Failed to find cfnOutput for ${param}`);
      continue;
    }

    output[param as keyof ParametersEdge] = edgeParam;
  }
  if (Object.keys(output).length > 1) return output as ParametersEdge;
  return null;
}