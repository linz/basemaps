import { CloudFormationClient, DescribeStacksCommand } from '@aws-sdk/client-cloudformation';

export interface ParametersEdge {
  CloudFrontBucket: string;
  CloudFrontLogBucket: string;
  CloudFrontDistributionId: string;
}

export interface ParametersServe {
  LambdaXyzUrl: string;
}
export const ParametersServeKeys: Record<keyof ParametersServe, string> = {
  LambdaXyzUrl: 'LambdaXyzUrl',
};

export const ParametersEdgeKeys: Record<keyof ParametersEdge, string> = {
  CloudFrontBucket: 'CloudFrontBucket',
  CloudFrontLogBucket: 'CloudFrontLogBucket',
  CloudFrontDistributionId: 'CloudFrontDistributionId',
};

export type ParameterKeys = typeof ParametersServeKeys | typeof ParametersEdgeKeys;

/**
 * Because cloudfront configuration has to be in US-East-1
 * We have to mirror cloudformation outputs into the Basemaps region of choice
 *
 * This function will lookup the configuration output from the `Edge` stack and provide them to following stacks
 */
export async function getParameters<T extends ParameterKeys>(
  region: string,
  stackName: string,
  keys: T,
): Promise<null | T> {
  const client = new CloudFormationClient({ region });
  const command = new DescribeStacksCommand({ StackName: stackName });
  const response = await client.send(command);
  if (command == null) {
    console.error('Failed to lookup edge stack.. has it been deployed?');
    return null;
  }

  const output: Record<string, unknown> = {};
  for (const param of Object.keys(keys)) {
    const edgeParam = response.Stacks?.[0].Outputs?.find((f) => f.OutputKey === param)?.OutputValue;
    if (edgeParam == null) {
      console.error(`Failed to find cfnOutput for ${param}`);
      continue;
    }

    output[param] = edgeParam;
  }

  if (Object.keys(output).length > 0) return output as T;
  return null;
}
