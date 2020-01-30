import cdk = require('@aws-cdk/core');
import iam = require('@aws-cdk/aws-iam');
import batch = require('@aws-cdk/aws-batch');
import ec2 = require('@aws-cdk/aws-ec2');
import ecrAssets = require('@aws-cdk/aws-ecr-assets');
import { Env } from '@basemaps/shared';
import { ScratchData } from './mount.folder';
import { createHash } from 'crypto';

/**
 * Cogification infrastructure
 */
export class CogBuilderStack extends cdk.Stack {
    public constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);
        const batchServiceRole = new iam.Role(this, 'CogBatchServiceRole', {
            roleName: 'CogBatchServiceRole',
            assumedBy: new iam.ServicePrincipal('batch.amazonaws.com'),
        });
        batchServiceRole.addManagedPolicy(
            iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSBatchServiceRole'),
        );

        const spotFleetRole = new iam.Role(this, 'CogSpotFleetRole', {
            roleName: 'CogSpotFleetRole',
            assumedBy: new iam.ServicePrincipal('spotfleet.amazonaws.com'),
        });
        spotFleetRole.addManagedPolicy(
            iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AmazonEC2SpotFleetTaggingRole'),
        );

        const batchInstanceRole = new iam.Role(this, 'CogBatchInstanceRole', {
            roleName: 'CogBatchInstanceRole',
            assumedBy: new iam.CompositePrincipal(
                new iam.ServicePrincipal('ec2.amazonaws.com'),
                new iam.ServicePrincipal('ecs.amazonaws.com'),
            ),
        });
        batchInstanceRole.addManagedPolicy(
            iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AmazonEC2ContainerServiceforEC2Role'),
        );
        batchInstanceRole.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonS3FullAccess'));

        new iam.CfnInstanceProfile(this, 'CogBatchInstanceProfile', {
            instanceProfileName: batchInstanceRole.roleName,
            roles: [batchInstanceRole.roleName],
        });

        const container = new ecrAssets.DockerImageAsset(this, 'CogContainer', {
            directory: '../cog/',
        });

        const vpc = ec2.Vpc.fromLookup(this, 'AlbVpc', { tags: { default: 'true' } });
        const sg = new ec2.SecurityGroup(this, 'CogBatchSecurity', { vpc });

        const launchTemplateData = {
            /**
             * This only resizes the HOST's file system, which default's to 22GB
             *
             * Each container is still limited to 8GB of storage but this allows
             * more containers to be run on each host
             */
            blockDeviceMappings: [
                {
                    deviceName: '/dev/xvdcz',
                    ebs: {
                        volumeSize: 128,
                        volumeType: 'gp2',
                    },
                },
                /**
                 * Provide a scratch folder for more temporary storage
                 * This will be mounted into each container
                 */
                {
                    deviceName: `/dev/${ScratchData.Device}`,
                    ebs: {
                        volumeSize: 512,
                        volumeType: 'gp2',
                    },
                },
            ],
            // Make a file system and mount the folder
            userData: ScratchData.UserData,
        };
        const launchTemplateDataId = createHash('sha256')
            .update(JSON.stringify(launchTemplateData))
            .digest('hex')
            .substr(0, 10);
        const launchTemplateName = `CogBatchLaunchTemplate-${launchTemplateDataId}`;
        new ec2.CfnLaunchTemplate(this, 'CogBatchLaunchTemplate', { launchTemplateData, launchTemplateName });

        const computeEnv = new batch.CfnComputeEnvironment(this, 'CogBatchCompute', {
            type: 'MANAGED',
            serviceRole: batchServiceRole.roleArn,
            computeResources: {
                type: 'SPOT',
                maxvCpus: 512,
                minvCpus: 0,
                desiredvCpus: 16,
                spotIamFleetRole: spotFleetRole.roleArn,
                instanceRole: batchInstanceRole.roleName,
                instanceTypes: ['c5.xlarge', 'c5.2xlarge', 'c5.4xlarge', 'c5.9xlarge'],
                subnets: vpc.privateSubnets.map(c => c.subnetId),
                securityGroupIds: [sg.securityGroupId],
                tags: {
                    CogBuilder: 'true',
                },
                launchTemplate: {
                    launchTemplateName,
                    version: '$Latest',
                },
            },
        });

        new batch.CfnJobDefinition(this, 'CogBatchJobDef', {
            jobDefinitionName: 'CogBatchJob',
            type: 'container',
            containerProperties: {
                image: container.imageUri,
                /**
                 * 1 cpu = 1024 CpuShares, this allows the container to use as many VCpu's
                 * as possible when in use, having more than 1 share means higher priority
                 *
                 * @see https://docs.docker.com/config/containers/resource_constraints/
                 */
                vcpus: 1,
                /**
                 * Most containers do not allocate the full 1GB (1024MB) to the container
                 * so this should not be a multiple of 1024
                 *
                 * Eg a instance with 8192MB allocates 7953MB usable
                 */
                memory: 3900,
                environment: [
                    {
                        name: Env.TempFolder,
                        value: ScratchData.Folder,
                    },
                ],
                mountPoints: [{ containerPath: ScratchData.Folder, sourceVolume: 'scratch' }],
                volumes: [{ name: 'scratch', host: { sourcePath: ScratchData.Folder } }],
            },
        });

        new batch.CfnJobQueue(this, 'CogBatchJobQueue', {
            jobQueueName: 'CogBatchJobQueue',
            computeEnvironmentOrder: [
                {
                    computeEnvironment: computeEnv.ref,
                    order: 1,
                },
            ],
            priority: 1,
        });
    }
}
