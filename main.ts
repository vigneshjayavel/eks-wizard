import { Construct } from 'constructs';
import {
  App,
  TerraformStack,
  CloudBackend,
  NamedCloudWorkspace,
  TerraformOutput,
} from 'cdktf';
import { AwsProvider } from '@cdktf/provider-aws/lib/provider';
import * as fs from 'fs';
import { Vpc } from '@cdktf/provider-aws/lib/vpc';
import { Subnet } from '@cdktf/provider-aws/lib/subnet';
import { RouteTable } from '@cdktf/provider-aws/lib/route-table';
import { Route } from '@cdktf/provider-aws/lib/route';
import { Instance } from '@cdktf/provider-aws/lib/instance';
import { SecurityGroup } from '@cdktf/provider-aws/lib/security-group';
import { RouteTableAssociation } from '@cdktf/provider-aws/lib/route-table-association';
import { Eip } from '@cdktf/provider-aws/lib/eip';
import { Route53Record } from '@cdktf/provider-aws/lib/route53-record';
import { Route53Zone } from '@cdktf/provider-aws/lib/route53-zone';
import { IamRole } from '@cdktf/provider-aws/lib/iam-role';
import { EksCluster } from '@cdktf/provider-aws/lib/eks-cluster';
import { EksNodeGroup } from '@cdktf/provider-aws/lib/eks-node-group';
import {
  dataAwsAvailabilityZones,
  dataAwsEksCluster,
  dataAwsEksClusterAuth,
} from '@cdktf/provider-aws';
import { InternetGateway } from '@cdktf/provider-aws/lib/internet-gateway';
import { NatGateway } from '@cdktf/provider-aws/lib/nat-gateway';
import { Fn } from 'cdktf';
import { IamRolePolicyAttachment } from '@cdktf/provider-aws/lib/iam-role-policy-attachment';
import {
  deployment,
  provider as k8s,
  service,
  secret,
} from '@cdktf/provider-kubernetes/';
import { IamRolePolicy } from '@cdktf/provider-aws/lib/iam-role-policy';
import { cloudServiceTree } from './lib/cloudServiceTreeParser';

class EksStack extends TerraformStack {
  public eks: dataAwsEksCluster.DataAwsEksCluster;
  public eksAuth: dataAwsEksClusterAuth.DataAwsEksClusterAuth;
  public vpc: Vpc;
  public mongoDbInstance: Instance;
  public igw: InternetGateway;
  public natGw: NatGateway;
  public subnetEksPrivate1: Subnet;
  public subnetEksPrivate2: Subnet;
  public subnetEksPrivate3: Subnet;
  public subnetEksPublic: Subnet;
  private userdata: string;
  private eip: Eip;
  constructor(scope: Construct, id: string) {
    super(scope, id);

    new AwsProvider(this, 'aws', { region: cloudServiceTree.region });
    const allAvailabilityZones =
      new dataAwsAvailabilityZones.DataAwsAvailabilityZones(
        this,
        'all-availability-zones',
        {}
      ).names;
    
    this.vpc = new Vpc(this, 'vpc-eks-app', {
      cidrBlock: cloudServiceTree.vpc.cidrBlock,
      enableDnsHostnames: true,
      tags: { Name: cloudServiceTree.vpc.name, Owner: cloudServiceTree.userId },
    });

    this.subnetEksPrivate1 = new Subnet(this, 'subnet-eks-private1', {
      vpcId: this.vpc.id,
      cidrBlock: '10.0.0.0/24',
      tags: {
        Name: 'subnet-eks-private1',
       Owner: cloudServiceTree.userId,
        'kubernetes.io/cluster/eks-app': 'shared',
        'kubernetes.io/role/elb': '1',
      },
      availabilityZone: Fn.element(allAvailabilityZones, 0),
    });

    this.subnetEksPrivate2 = new Subnet(this, 'subnet-eks-private2', {
      vpcId: this.vpc.id,
      cidrBlock: '10.0.1.0/24',
      tags: {
        Name: 'subnet-eks-private2',
       Owner: cloudServiceTree.userId,
        'kubernetes.io/cluster/eks-app': 'shared',
        'kubernetes.io/role/internal-elb': '1',
      },
      availabilityZone: Fn.element(allAvailabilityZones, 1),
    });

    this.subnetEksPrivate3 = new Subnet(this, 'subnet-eks-private3', {
      vpcId: this.vpc.id,
      cidrBlock: '10.0.2.0/24',
      tags: {
        Name: 'subnet-eks-private2',
       Owner: cloudServiceTree.userId,
        'kubernetes.io/cluster/eks-app': 'shared',
        'kubernetes.io/role/internal-elb': '1',
      },
      availabilityZone: Fn.element(allAvailabilityZones, 2),
    });

    this.subnetEksPublic = new Subnet(this, 'subnet-eks-public', {
      vpcId: this.vpc.id,
      cidrBlock: '10.0.3.0/24',
      tags: {
        Name: 'subnet-MongoD',
       Owner: cloudServiceTree.userId,
        'kubernetes.io/cluster/eks-app': 'shared',
        'kubernetes.io/role/internal-elb': '1',
      },
    });

    this.igw = new InternetGateway(this, 'igw', {
      vpcId: this.vpc.id,
      tags: {
        Name: 'igw-eks-app',
       Owner: cloudServiceTree.userId,
      },
    });

    const eipForNat = new Eip(this, 'EipForNat', {
      tags: {
        Name: 'eip-for-nat-eks-app',
       Owner: cloudServiceTree.userId,
      },
    });

    this.natGw = new NatGateway(this, 'natGw', {
      allocationId: eipForNat.id,
      subnetId: this.subnetEksPublic.id,
      tags: {
        Name: 'natGw-eks-app',
       Owner: cloudServiceTree.userId,
      },
    });

    const routeTablePublic = new RouteTable(
      this,
      'route-table-eks-app-public-subnet',
      {
        vpcId: this.vpc.id,
        tags: {
          Name: 'route-table-eks-app-public-subnet',
         Owner: cloudServiceTree.userId,
        },
      }
    );

    new RouteTableAssociation(this, 'route-table-association', {
      routeTableId: routeTablePublic.id,
      subnetId: this.subnetEksPublic.id,
    });

    new Route(this, 'route-to-igw', {
      routeTableId: routeTablePublic.id,
      gatewayId: this.igw.id,
      destinationCidrBlock: '0.0.0.0/0',
    });

    const routeTablePrivate = new RouteTable(
      this,
      'route-table-eks-app-private',
      {
        vpcId: this.vpc.id,
        tags: {
          Name: 'route-table-eks-app-privatet',
         Owner: cloudServiceTree.userId,
        },
      }
    );

    new RouteTableAssociation(this, 'route-table-association-1', {
      routeTableId: routeTablePrivate.id,
      subnetId: this.subnetEksPrivate1.id,
    });

    new RouteTableAssociation(this, 'route-table-association-2', {
      routeTableId: routeTablePrivate.id,
      subnetId: this.subnetEksPrivate2.id,
    });
    new RouteTableAssociation(this, 'route-table-association-3', {
      routeTableId: routeTablePrivate.id,
      subnetId: this.subnetEksPrivate3.id,
    });

    new Route(this, 'route-to-natgw', {
      routeTableId: routeTablePublic.id,
      gatewayId: this.igw.id,
      destinationCidrBlock: '0.0.0.0/0',
    });

    new Route(this, 'route-to-natGw', {
      natGatewayId: this.natGw.id,
      routeTableId: routeTablePrivate.id,
      destinationCidrBlock: '0.0.0.0/0',
    });

    const securityGroupMongoDb = new SecurityGroup(
      this,
      'security-group-mongoDB',
      {
        namePrefix: 'security-group-mongoDB',
        vpcId: this.vpc.id,
        ingress: [
          {
            fromPort: 22,
            toPort: 22,
            protocol: 'tcp',
            description: 'ssh',
            cidrBlocks: ['0.0.0.0/0'],
          },
          {
            fromPort: 27017,
            toPort: 27017,
            protocol: 'tcp',
            description: 'mongoDB',
            cidrBlocks: ['0.0.0.0/0'],
          },
        ],
        egress: [
          {
            fromPort: 0,
            toPort: 0,
            protocol: '-1',
            description: 'all egress',
            cidrBlocks: ['0.0.0.0/0'],
          },
        ],
        tags: {
          Name: 'security-group-mongoDB',
         Owner: cloudServiceTree.userId,
        },
      }
    );

    this.userdata = fs.readFileSync('userdata.sh', 'utf8');

    this.mongoDbInstance = new Instance(this, 'instance-mongoDb', {
      subnetId: this.subnetEksPublic.id,
      instanceType: 't3.micro',
      tags: { Name: 'MongoDB_centos7',Owner: cloudServiceTree.userId },
      ami: 'ami-0a3a6d4d737db3bc1',
      associatePublicIpAddress: true,
      vpcSecurityGroupIds: [securityGroupMongoDb.id],
      keyName: 'Key_MBP_fdervisi',
      userData: this.userdata,
    });

    this.eip = new Eip(this, 'eip', {
      instance: this.mongoDbInstance.id,
      tags: { Name: 'eip_MongoDB',Owner: cloudServiceTree.userId },
    });

    const privateHostedZone = new Route53Zone(this, 'route53-zone', {
      name: 'fdervisi.io',
      vpc: [
        {
          vpcId: this.vpc.id,
        },
      ],
      tags: {Owner: cloudServiceTree.userId },
    });

    new Route53Record(this, 'route53-record', {
      name: 'mongodb.fdervisi.io',
      type: 'A',
      zoneId: privateHostedZone.zoneId,
      ttl: 300,
      records: [this.eip.publicIp],
    });

    const eksRole = new IamRole(this, 'iam-eks-role', {
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
    });

    new IamRolePolicyAttachment(this, 'iam-eks-policy-attachment-1', {
      role: eksRole.name,
      policyArn: 'arn:aws:iam::aws:policy/AmazonEKSClusterPolicy',
    });

    new IamRolePolicyAttachment(this, 'iam-eks-policy-attachment-2', {
      role: eksRole.name,
      policyArn: 'arn:aws:iam::aws:policy/AmazonEKSVPCResourceController',
    });

    new IamRolePolicy(this, 'iam-eks-node-group-policy', {
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
    });

    new IamRolePolicy(this, 'iam-eks-node-group-policy-1', {
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
    });

    const cluster = new EksCluster(this, 'eks-cluster', {
      name: 'eks-app',
      roleArn: eksRole.arn,
      vpcConfig: {
        subnetIds: [
          this.subnetEksPrivate1.id,
          this.subnetEksPrivate2.id,
          this.subnetEksPrivate3.id,
        ],
        endpointPublicAccess: true,
      },
      tags: {
       Owner: cloudServiceTree.userId,
      },
    });

    const nodeGroupRole = new IamRole(this, 'iam-eks-node-group-role', {
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
    });

    new IamRolePolicyAttachment(this, 'iam-eks-node-group-policy-attachment-1', {
      role: nodeGroupRole.name,
      policyArn: 'arn:aws:iam::aws:policy/AmazonEKSWorkerNodePolicy',
    });

    new IamRolePolicyAttachment(this, 'iam-eks-node-group-policy-attachment-2', {
      role: nodeGroupRole.name,
      policyArn: 'arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryReadOnly',
    });

    new IamRolePolicyAttachment(this, 'iam-eks-node-group-policy-attachment-3', {
      role: nodeGroupRole.name,
      policyArn: 'arn:aws:iam::aws:policy/AmazonEKS_CNI_Policy',
    });

    new IamRolePolicyAttachment(this, 'iam-eks-node-group-policy-attachment-4', {
      role: nodeGroupRole.name,
      policyArn: 'arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore',
    });

    new EksNodeGroup(this, 'eks-node-group', {
      clusterName: cluster.name,
      nodeGroupName: 'eks-node-group',
      nodeRoleArn: nodeGroupRole.arn,
      instanceTypes: ['t3.small'],
      subnetIds: [
        this.subnetEksPrivate1.id,
        this.subnetEksPrivate2.id,
        this.subnetEksPrivate3.id,
      ],
      scalingConfig: {
        desiredSize: 3,
        maxSize: 5,
        minSize: 1,
      },
      tags: {
       Owner: cloudServiceTree.userId,
      },
    });

    // We create the Eks cluster within the module, this is so we can access the cluster resource afterwards
    this.eks = new dataAwsEksCluster.DataAwsEksCluster(this, 'data-eks-cluster', {
      name: cluster.name,
    });

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

class KubernetesApplicationStack extends TerraformStack {
  constructor(
    scope: Construct,
    id: string,
    cluster: dataAwsEksCluster.DataAwsEksCluster,
    clusterAuth: dataAwsEksClusterAuth.DataAwsEksClusterAuth
  ) {
    super(scope, id);

    new k8s.KubernetesProvider(this, 'cluster', {
      host: cluster.endpoint,
      clusterCaCertificate: Fn.base64decode(
        cluster.certificateAuthority.get(0).data
      ),
      token: clusterAuth.token,
    });

    const mogoDbSecrete = new secret.Secret(this, 'mongodb-secret', {
      metadata: {
        name: 'mongodb-secret',
      },

      data: {
        MONGODB_URI: Buffer.from(
          'mongodb://admin:admin@mongodb.fdervisi.io:27017/TodoApp'
        ).toString(),
      },
    });

    const backendDeployment = new deployment.Deployment(
      this,
      'backend-deployment',
      {
        metadata: {
          name: 'backend',
        },
        spec: {
          replicas: '1',
          selector: {
            matchLabels: {
              app: 'backend',
            },
          },
          template: {
            metadata: {
              labels: {
                app: 'backend',
              },
            },
            spec: {
              container: [
                {
                  name: 'backend',
                  image: 'fdervisi/backend',
                  env: [
                    {
                      name: 'MONGODB_URI',
                      valueFrom: {
                        secretKeyRef: {
                          name: mogoDbSecrete.metadata.name,
                          key: 'MONGODB_URI',
                        },
                      },
                    },
                  ],
                },
              ],
            },
          },
        },
      }
    );

    new service.Service(this, 'backend-service', {
      metadata: {
        name: 'backend',
      },
      spec: {
        port: [
          {
            port: 3000,
            targetPort: '3000',
          },
        ],
        selector: {
          app: backendDeployment.metadata.name,
        },
      },
    });

    const frontendDeployment = new deployment.Deployment(this, 'frontend', {
      metadata: {
        name: 'frontend',
      },
      spec: {
        replicas: '1',
        selector: {
          matchLabels: {
            app: 'frontend',
          },
        },
        template: {
          metadata: {
            labels: {
              app: 'frontend',
            },
          },
          spec: {
            container: [
              {
                name: 'frontend',
                image: 'fdervisi/frontend',
                port: [
                  {
                    containerPort: 3000,
                  },
                ],
              },
            ],
          },
        },
      },
    });

    new service.Service(this, 'frontend-service', {
      metadata: {
        name: 'frontend',
      },
      spec: {
        type: 'LoadBalancer',
        port: [
          {
            port: 3000,
            targetPort: '3000',
          },
        ],
        selector: {
          app: frontendDeployment.metadata.name,
        },
      },
    });
  }
}

const app = new App();
const eksStack = new EksStack(app, 'eks-app');

new KubernetesApplicationStack(
  app,
  'applications',
  eksStack.eks,
  eksStack.eksAuth
);
new CloudBackend(eksStack, {
  hostname: 'app.terraform.io',
  organization: 'fdervisi',
  workspaces: new NamedCloudWorkspace('eks-app'),
});
app.synth();
