// Import all the necessary classes from the AWS CDKTF and Constructs libraries.
import { EksCluster } from '@cdktf/provider-aws/lib/eks-cluster';
import { EksNodeGroup } from '@cdktf/provider-aws/lib/eks-node-group';
import { dataAwsEksCluster, dataAwsEksClusterAuth } from '@cdktf/provider-aws';
import { IamRole } from '@cdktf/provider-aws/lib/iam-role';
import { IamRolePolicy } from '@cdktf/provider-aws/lib/iam-role-policy';
import { IamRolePolicyAttachment } from '@cdktf/provider-aws/lib/iam-role-policy-attachment';
import { TerraformOutput } from 'cdktf';
import { Construct } from 'constructs';
import { IEks } from './CloudServiceTreeInterface';

// Define the structure of the configuration needed to set up the EKS stack.
interface EksStackConfig {
  vpcId: string;
  userId: string;
  eks: IEks;
  subnetIds: string[];
}

// Define the main class, EksStack, which extends the Construct class from the Constructs library.
export class EksStack extends Construct {
  public eks: dataAwsEksCluster.DataAwsEksCluster;
  public eksAuth: dataAwsEksClusterAuth.DataAwsEksClusterAuth;
/**
 * EksStack class creates an Amazon Elastic Kubernetes Service (EKS) cluster and node group with the provided configurations.
 * @param scope - The parent Construct instantiating this class.
 * @param id - The unique identifier for this class instance within the parent Construct.
 * @param config - The configurations for the EKS cluster and node group.
 */

  constructor(scope: Construct, id: string, config: EksStackConfig) {
    super(scope, id);

    // Create the IAM role that will be used by the EKS cluster.
    const eksRole = new IamRole(
      this,
      `iam-eks-role-${config.eks.clusterName}`,
      {
        // AssumeRole policy allows the EKS service to assume this role.
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

    // Attach the necessary policies to the EKS role.
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

    // Define custom policies for the EKS cluster's role.
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

    // Define the EKS cluster using the configurations provided.
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

    // Create an IAM role for the EKS node group.
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

    // Attach necessary policies to the EKS node group role.
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

    // Define the EKS node group with the configurations provided.
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

    // Fetch the details of the created EKS cluster for further use.
    this.eks = new dataAwsEksCluster.DataAwsEksCluster(
      this,
      'data-eks-cluster',
      {
        name: cluster.name,
      }
    );

    // Fetch the auth details of the created EKS cluster for further use.
    this.eksAuth = new dataAwsEksClusterAuth.DataAwsEksClusterAuth(
      this,
      'data-eks-auth',
      {
        name: cluster.name,
      }
    );

    // Output the name of the EKS cluster. This can be used to reference the cluster in other Terraform configurations.
    new TerraformOutput(this, 'eks-cluster-name', {
      value: cluster.name,
    });
  }
}
