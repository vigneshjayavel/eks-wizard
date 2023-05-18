import { EksCluster } from '@cdktf/provider-aws/lib/eks-cluster';
import { EksNodeGroup } from '@cdktf/provider-aws/lib/eks-node-group';
import { dataAwsEksCluster, dataAwsEksClusterAuth } from '@cdktf/provider-aws';
import { IamRole } from '@cdktf/provider-aws/lib/iam-role';
import { IamRolePolicy } from '@cdktf/provider-aws/lib/iam-role-policy';
import { IamRolePolicyAttachment } from '@cdktf/provider-aws/lib/iam-role-policy-attachment';
import { TerraformOutput } from 'cdktf';
import { Construct } from 'constructs';
import { IEks } from './CloudServiceTreeInterface';
interface EksStackConfig {
  vpcId: string;
  userId: string;
  eks: IEks;
  subnetIds: string[];
}

export class EksStack extends Construct {
  public eks: dataAwsEksCluster.DataAwsEksCluster;
  public eksAuth: dataAwsEksClusterAuth.DataAwsEksClusterAuth;
  constructor(scope: Construct, id: string, config: EksStackConfig) {
    super(scope, id);

    const eksRole = new IamRole(
      this,
      `iam-eks-role-${config.eks.clusterName}`,
      {
        assumeRolePolicy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Action: 'sts:AssumeRole',
              Principal: {
                Service: 'eks.amazonaws.com',
              },
              Effect: 'Allow',
            },
          ],
        }),
      }
    );

    new IamRolePolicyAttachment(
      this,
      `iam-eks-policy-attachment-1-${config.eks.clusterName}`,
      {
        role: eksRole.name,
        policyArn: 'arn:aws:iam::aws:policy/AmazonEKSClusterPolicy',
      }
    );

    new IamRolePolicyAttachment(
      this,
      `iam-eks-policy-attachment-2-${config.eks.clusterName}`,
      {
        role: eksRole.name,
        policyArn: 'arn:aws:iam::aws:policy/AmazonEKSVPCResourceController',
      }
    );

    new IamRolePolicy(
      this,
      `iam-eks-node-group-policy-${config.eks.clusterName}`,
      {
        role: eksRole.name,
        policy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Action: ['cloudwatch:PutMetricData'],
              Resource: '*',
              Effect: 'Allow',
            },
          ],
        }),
      }
    );

    new IamRolePolicy(
      this,
      `iam-eks-node-group-policy-1-${config.eks.clusterName}`,
      {
        role: eksRole.name,
        policy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Action: [
                'ec2:DescribeAccountAttributes',
                'ec2:DescribeAddresses',
                'ec2:DescribeInternetGateways',
              ],
              Resource: '*',
              Effect: 'Allow',
            },
          ],
        }),
      }
    );

    const cluster = new EksCluster(
      this,
      `eks-cluster-${config.eks.clusterName}`,
      {
        name: config.eks.clusterName,
        roleArn: eksRole.arn,
        vpcConfig: {
          subnetIds: config.subnetIds,
          endpointPublicAccess: true,
        },
        tags: {
          Owner: config.userId,
        },
      }
    );

    const nodeGroupRole = new IamRole(
      this,
      `iam-eks-node-group-role-${config.eks.clusterName}`,
      {
        assumeRolePolicy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Principal: { Service: 'ec2.amazonaws.com' },
              Action: 'sts:AssumeRole',
            },
          ],
        }),
      }
    );

    new IamRolePolicyAttachment(
      this,
      `iam-eks-node-group-policy-attachment-1-${config.eks.clusterName}`,
      {
        role: nodeGroupRole.name,
        policyArn: 'arn:aws:iam::aws:policy/AmazonEKSWorkerNodePolicy',
      }
    );

    new IamRolePolicyAttachment(
      this,
      `iam-eks-node-group-policy-attachment-2-${config.eks.clusterName}`,
      {
        role: nodeGroupRole.name,
        policyArn: 'arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryReadOnly',
      }
    );

    new IamRolePolicyAttachment(
      this,
      `iam-eks-node-group-policy-attachment-3-${config.eks.clusterName}`,
      {
        role: nodeGroupRole.name,
        policyArn: 'arn:aws:iam::aws:policy/AmazonEKS_CNI_Policy',
      }
    );

    new IamRolePolicyAttachment(
      this,
      `iam-eks-node-group-policy-attachment-4-${config.eks.clusterName}`,
      {
        role: nodeGroupRole.name,
        policyArn: 'arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore',
      }
    );

    new EksNodeGroup(this, `eks-node-group-${config.eks.clusterName}`, {
      clusterName: cluster.name,
      nodeGroupName: `eks-node-group-${config.eks.clusterName}`,
      nodeRoleArn: nodeGroupRole.arn,
      instanceTypes: [config.eks.nodeGroup.instanceTypes],
      subnetIds: config.subnetIds,
      scalingConfig: {
        desiredSize: config.eks.nodeGroup.scalingConfig.desiredSize,
        maxSize: config.eks.nodeGroup.scalingConfig.maxSize,
        minSize: config.eks.nodeGroup.scalingConfig.minSize,
      },
      tags: {
        Owner: config.userId,
      },
    });

    // We create the Eks cluster within the module, this is so we can access the cluster resource afterwards
    this.eks = new dataAwsEksCluster.DataAwsEksCluster(
      this,
      'data-eks-cluster',
      {
        name: cluster.name,
      }
    );

    // We need to fetch the authentication data from the EKS cluster as well
    this.eksAuth = new dataAwsEksClusterAuth.DataAwsEksClusterAuth(
      this,
      'data-eks-auth',
      {
        name: cluster.name,
      }
    );

    // Add this after creating the EKS cluster
    new TerraformOutput(this, 'eks-cluster-name', {
      value: cluster.name,
    });
  }
}
