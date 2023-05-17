import { Construct } from 'constructs';
import {
  App,
  TerraformStack,
  CloudBackend,
  NamedCloudWorkspace,
  // TerraformOutput,
} from 'cdktf';
import { AwsProvider } from '@cdktf/provider-aws/lib/provider';
// import { Route53Record } from '@cdktf/provider-aws/lib/route53-record';
// import { Route53Zone } from '@cdktf/provider-aws/lib/route53-zone';
// import { IamRole } from '@cdktf/provider-aws/lib/iam-role';
// import { EksCluster } from '@cdktf/provider-aws/lib/eks-cluster';
// import { EksNodeGroup } from '@cdktf/provider-aws/lib/eks-node-group';
// import { dataAwsEksCluster, dataAwsEksClusterAuth } from '@cdktf/provider-aws';
// import { Fn } from 'cdktf';
//import { IamRolePolicyAttachment } from '@cdktf/provider-aws/lib/iam-role-policy-attachment';
// import {
//   deployment,
//   provider as k8s,
//   service,
//   secret,
// } from '@cdktf/provider-kubernetes/';
//import { IamRolePolicy } from '@cdktf/provider-aws/lib/iam-role-policy';
import { cloudServiceTree } from './lib/cloudServiceTreeParser';
import { VpcStack } from './lib/vpcStack';

class EksStack extends TerraformStack {
  // public eks: dataAwsEksCluster.DataAwsEksCluster;
  // public eksAuth: dataAwsEksClusterAuth.DataAwsEksClusterAuth;
  public vpc: VpcStack;
  constructor(scope: Construct, id: string) {
    super(scope, id);

    new AwsProvider(this, 'aws', { region: cloudServiceTree.region });

    this.vpc = new VpcStack(this, 'network', {
      userId: cloudServiceTree.userId,
      eksCluster: cloudServiceTree.vpc.eks?.clusterName,
      vpc: cloudServiceTree.vpc,
    });

    // const privateHostedZone = new Route53Zone(this, 'route53-zone', {
    //   name: 'fdervisi.io',
    //   vpc: [
    //     {
    //       vpcId: this.vpc.vpc.id,
    //     },
    //   ],
    //   tags: { Owner: cloudServiceTree.userId },
    // });

    // new Route53Record(this, 'route53-record', {
    //   name: 'mongodb.fdervisi.io',
    //   type: 'A',
    //   zoneId: privateHostedZone.zoneId,
    //   ttl: 300,
    //   // records: [this.eip.publicIp],
    //   records: ["13.14.15.16"],
    // });

    // const eksRole = new IamRole(this, 'iam-eks-role', {
    //   assumeRolePolicy: JSON.stringify({
    //     Version: '2012-10-17',
    //     Statement: [
    //       {
    //         Action: 'sts:AssumeRole',
    //         Principal: {
    //           Service: 'eks.amazonaws.com',
    //         },
    //         Effect: 'Allow',
    //       },
    //     ],
    //   }),
    // });

    // new IamRolePolicyAttachment(this, 'iam-eks-policy-attachment-1', {
    //   role: eksRole.name,
    //   policyArn: 'arn:aws:iam::aws:policy/AmazonEKSClusterPolicy',
    // });

    // new IamRolePolicyAttachment(this, 'iam-eks-policy-attachment-2', {
    //   role: eksRole.name,
    //   policyArn: 'arn:aws:iam::aws:policy/AmazonEKSVPCResourceController',
    // });

    // new IamRolePolicy(this, 'iam-eks-node-group-policy', {
    //   role: eksRole.name,
    //   policy: JSON.stringify({
    //     Version: '2012-10-17',
    //     Statement: [
    //       {
    //         Action: ['cloudwatch:PutMetricData'],
    //         Resource: '*',
    //         Effect: 'Allow',
    //       },
    //     ],
    //   }),
    // });

    // new IamRolePolicy(this, 'iam-eks-node-group-policy-1', {
    //   role: eksRole.name,
    //   policy: JSON.stringify({
    //     Version: '2012-10-17',
    //     Statement: [
    //       {
    //         Action: [
    //           'ec2:DescribeAccountAttributes',
    //           'ec2:DescribeAddresses',
    //           'ec2:DescribeInternetGateways',
    //         ],
    //         Resource: '*',
    //         Effect: 'Allow',
    //       },
    //     ],
    //   }),
    // });

    // const cluster = new EksCluster(this, 'eks-cluster', {
    //   name: 'eks-app',
    //   roleArn: eksRole.arn,
    //   vpcConfig: {
    //     subnetIds: [
    //       this.vpc.subnets[0].id,
    //       this.vpc.subnets[1].id,
    //       this.vpc.subnets[2].id,
    //     ],
    //     endpointPublicAccess: true,
    //   },
    //   tags: {
    //     Owner: cloudServiceTree.userId,
    //   },
    // });

    // const nodeGroupRole = new IamRole(this, 'iam-eks-node-group-role', {
    //   assumeRolePolicy: JSON.stringify({
    //     Version: '2012-10-17',
    //     Statement: [
    //       {
    //         Effect: 'Allow',
    //         Principal: { Service: 'ec2.amazonaws.com' },
    //         Action: 'sts:AssumeRole',
    //       },
    //     ],
    //   }),
    // });

    // new IamRolePolicyAttachment(
    //   this,
    //   'iam-eks-node-group-policy-attachment-1',
    //   {
    //     role: nodeGroupRole.name,
    //     policyArn: 'arn:aws:iam::aws:policy/AmazonEKSWorkerNodePolicy',
    //   }
    // );

    // new IamRolePolicyAttachment(
    //   this,
    //   'iam-eks-node-group-policy-attachment-2',
    //   {
    //     role: nodeGroupRole.name,
    //     policyArn: 'arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryReadOnly',
    //   }
    // );

    // new IamRolePolicyAttachment(
    //   this,
    //   'iam-eks-node-group-policy-attachment-3',
    //   {
    //     role: nodeGroupRole.name,
    //     policyArn: 'arn:aws:iam::aws:policy/AmazonEKS_CNI_Policy',
    //   }
    // );

    // new IamRolePolicyAttachment(
    //   this,
    //   'iam-eks-node-group-policy-attachment-4',
    //   {
    //     role: nodeGroupRole.name,
    //     policyArn: 'arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore',
    //   }
    // );

    // new EksNodeGroup(this, 'eks-node-group', {
    //   clusterName: cluster.name,
    //   nodeGroupName: 'eks-node-group',
    //   nodeRoleArn: nodeGroupRole.arn,
    //   instanceTypes: ['t3.small'],
    //   subnetIds: [
    //     this.vpc.subnets[0].id,
    //     this.vpc.subnets[1].id,
    //     this.vpc.subnets[2].id,
    //   ],
    //   scalingConfig: {
    //     desiredSize: 3,
    //     maxSize: 5,
    //     minSize: 1,
    //   },
    //   tags: {
    //     Owner: cloudServiceTree.userId,
    //   },
    // });

    // // We create the Eks cluster within the module, this is so we can access the cluster resource afterwards
    // this.eks = new dataAwsEksCluster.DataAwsEksCluster(
    //   this,
    //   'data-eks-cluster',
    //   {
    //     name: cluster.name,
    //   }
    // );

    // // We need to fetch the authentication data from the EKS cluster as well
    // this.eksAuth = new dataAwsEksClusterAuth.DataAwsEksClusterAuth(
    //   this,
    //   'data-eks-auth',
    //   {
    //     name: cluster.name,
    //   }
    // );

    // // Add this after creating the EKS cluster
    // new TerraformOutput(this, 'eks-cluster-name', {
    //   value: cluster.name,
    // });
  }
}

// class KubernetesApplicationStack extends TerraformStack {
//   constructor(
//     scope: Construct,
//     id: string,
//     cluster: dataAwsEksCluster.DataAwsEksCluster,
//     clusterAuth: dataAwsEksClusterAuth.DataAwsEksClusterAuth
//   ) {
//     super(scope, id);

//     new k8s.KubernetesProvider(this, 'cluster', {
//       host: cluster.endpoint,
//       clusterCaCertificate: Fn.base64decode(
//         cluster.certificateAuthority.get(0).data
//       ),
//       token: clusterAuth.token,
//     });

//     const mogoDbSecrete = new secret.Secret(this, 'mongodb-secret', {
//       metadata: {
//         name: 'mongodb-secret',
//       },

//       data: {
//         MONGODB_URI: Buffer.from(
//           'mongodb://admin:admin@mongodb.fdervisi.io:27017/TodoApp'
//         ).toString(),
//       },
//     });

//     const backendDeployment = new deployment.Deployment(
//       this,
//       'backend-deployment',
//       {
//         metadata: {
//           name: 'backend',
//         },
//         spec: {
//           replicas: '1',
//           selector: {
//             matchLabels: {
//               app: 'backend',
//             },
//           },
//           template: {
//             metadata: {
//               labels: {
//                 app: 'backend',
//               },
//             },
//             spec: {
//               container: [
//                 {
//                   name: 'backend',
//                   image: 'fdervisi/backend',
//                   env: [
//                     {
//                       name: 'MONGODB_URI',
//                       valueFrom: {
//                         secretKeyRef: {
//                           name: mogoDbSecrete.metadata.name,
//                           key: 'MONGODB_URI',
//                         },
//                       },
//                     },
//                   ],
//                 },
//               ],
//             },
//           },
//         },
//       }
//     );

//     new service.Service(this, 'backend-service', {
//       metadata: {
//         name: 'backend',
//       },
//       spec: {
//         port: [
//           {
//             port: 3000,
//             targetPort: '3000',
//           },
//         ],
//         selector: {
//           app: backendDeployment.metadata.name,
//         },
//       },
//     });

//     const frontendDeployment = new deployment.Deployment(this, 'frontend', {
//       metadata: {
//         name: 'frontend',
//       },
//       spec: {
//         replicas: '1',
//         selector: {
//           matchLabels: {
//             app: 'frontend',
//           },
//         },
//         template: {
//           metadata: {
//             labels: {
//               app: 'frontend',
//             },
//           },
//           spec: {
//             container: [
//               {
//                 name: 'frontend',
//                 image: 'fdervisi/frontend',
//                 port: [
//                   {
//                     containerPort: 3000,
//                   },
//                 ],
//               },
//             ],
//           },
//         },
//       },
//     });

//     new service.Service(this, 'frontend-service', {
//       metadata: {
//         name: 'frontend',
//       },
//       spec: {
//         type: 'LoadBalancer',
//         port: [
//           {
//             port: 3000,
//             targetPort: '3000',
//           },
//         ],
//         selector: {
//           app: frontendDeployment.metadata.name,
//         },
//       },
//     });
//   }
// }

const app = new App();
const eksStack = new EksStack(app, 'eks-app');

// new KubernetesApplicationStack(
//   app,
//   'applications',
//   eksStack.eks,
//   eksStack.eksAuth
// );
new CloudBackend(eksStack, {
  hostname: 'app.terraform.io',
  organization: 'fdervisi',
  workspaces: new NamedCloudWorkspace('eks-app'),
});
app.synth();
