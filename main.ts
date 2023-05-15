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
//import { InternetGateway } from '@cdktf/provider-aws/lib/internet-gateway';
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
import { Namespace } from '@cdktf/provider-kubernetes/lib/namespace';
import {
  deployment,
  provider as k8s,
  service,
} from '@cdktf/provider-kubernetes/';
import { IamRolePolicy } from '@cdktf/provider-aws/lib/iam-role-policy';

class MyStack extends TerraformStack {
  public eks: dataAwsEksCluster.DataAwsEksCluster;
  public eksAuth: dataAwsEksClusterAuth.DataAwsEksClusterAuth;
  public vpc: Vpc;
  public instance: Instance;
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

    new AwsProvider(this, 'aws', { region: 'eu-south-1' });

    const allAvailabilityZones =
      new dataAwsAvailabilityZones.DataAwsAvailabilityZones(
        this,
        'all-availability-zones',
        {}
      ).names;

    this.vpc = new Vpc(this, 'vpc', {
      cidrBlock: '10.0.0.0/20',
      enableDnsHostnames: true,
      tags: { Name: 'vpc-eks-app', Owner: 'fdervisi' },
    });

    this.subnetEksPrivate1 = new Subnet(this, 'subnet-eks-private1', {
      vpcId: this.vpc.id,
      cidrBlock: '10.0.0.0/24',
      tags: {
        Name: 'subnet-eks-private1',
        Owner: 'fdervisi',
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
        Owner: 'fdervisi',
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
        Owner: 'fdervisi',
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
        Owner: 'fdervisi',
        'kubernetes.io/cluster/eks-app': 'shared',
        'kubernetes.io/role/internal-elb': '1',
      },
    });

    this.igw = new InternetGateway(this, 'igw', {
      vpcId: this.vpc.id,
    });

    const eipForNat = new Eip(this, 'EipForNat', {});

    this.natGw = new NatGateway(this, 'natGw', {
      allocationId: eipForNat.id,
      subnetId: this.subnetEksPublic.id,
    });

    const routeTablePublic = new RouteTable(this, 'route-table-public', {
      vpcId: this.vpc.id,
    });

    new RouteTableAssociation(this, 'route-table-association', {
      routeTableId: routeTablePublic.id,
      subnetId: this.subnetEksPublic.id,
    });

    new Route(this, 'route-to-igw', {
      routeTableId: routeTablePublic.id,
      gatewayId: this.igw.id,
      destinationCidrBlock: '0.0.0.0/0',
    });

    const routeTablePrivate = new RouteTable(this, 'route-table-private', {
      vpcId: this.vpc.id,
    });

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

    const securityGroupMgmt = new SecurityGroup(this, 'worker_group_mgmt_one', {
      namePrefix: 'worker_group_mgmt_one',
      vpcId: this.vpc.id,

      ingress: [
        {
          fromPort: 22,
          toPort: 22,
          protocol: 'tcp',

          cidrBlocks: ['0.0.0.0/0'],
        },
        {
          fromPort: 27017,
          toPort: 27017,
          protocol: 'tcp',

          cidrBlocks: ['0.0.0.0/0'],
        },
      ],
      egress: [
        {
          fromPort: 0,
          toPort: 0,
          protocol: '-1',
          cidrBlocks: ['0.0.0.0/0'],
        },
      ],
    });

    this.userdata = fs.readFileSync('userdata.sh', 'utf8');

    this.instance = new Instance(this, 'instance1', {
      subnetId: this.subnetEksPublic.id,
      instanceType: 't3.micro',
      tags: { Name: 'MongoDB_centos7', Owner: 'fdervisi' },
      ami: 'ami-0a3a6d4d737db3bc1',
      associatePublicIpAddress: true,
      securityGroups: [securityGroupMgmt.id],
      keyName: 'Key_MBP_fdervisi',
      userData: this.userdata,
    });

    this.eip = new Eip(this, 'eip', {
      instance: this.instance.id,
      tags: { Name: 'eip_MongoDB', Owner: 'fdervisi' },
    });

    const privateHostedZone = new Route53Zone(this, 'Route53Zone', {
      name: 'fdervisi.io',
      vpc: [
        {
          vpcId: this.vpc.id,
        },
      ],
    });

    new Route53Record(this, 'Route53Record', {
      name: 'mongodb.fdervisi.io',
      type: 'A',
      zoneId: privateHostedZone.zoneId,
      ttl: 300,
      records: [this.eip.publicIp],
    });

    const eksRole = new IamRole(this, 'EksRole', {
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

    new IamRolePolicyAttachment(this, 'EksPolicyAttachment1', {
      role: eksRole.name,
      policyArn: 'arn:aws:iam::aws:policy/AmazonEKSClusterPolicy',
    });

    new IamRolePolicyAttachment(this, 'EksPolicyAttachment2', {
      role: eksRole.name,
      policyArn: 'arn:aws:iam::aws:policy/AmazonEKSVPCResourceController',
    });

    new IamRolePolicy(this, 'NodeGroupPolicy', {
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

    new IamRolePolicy(this, 'NodeGroupPolicy2', {
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

    // Create an EKS cluster
    const cluster = new EksCluster(this, 'Cluster', {
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
    });

    // Create an IAM role for the EKS node group
    const nodeGroupRole = new IamRole(this, 'NodeGroupRole', {
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

    // Attach AmazonEKSWorkerNodePolicy to the IAM role
    new IamRolePolicyAttachment(this, 'NodeGroupRolePolicyAttachment1', {
      role: nodeGroupRole.name,
      policyArn: 'arn:aws:iam::aws:policy/AmazonEKSWorkerNodePolicy',
    });

    // Attach AmazonEC2ContainerRegistryReadOnly policy to the IAM role
    new IamRolePolicyAttachment(this, 'NodeGroupRolePolicyAttachment2', {
      role: nodeGroupRole.name,
      policyArn: 'arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryReadOnly',
    });

    // Attach AmazonEC2ContainerRegistryReadOnly policy to the IAM role
    new IamRolePolicyAttachment(this, 'NodeGroupRolePolicyAttachment3', {
      role: nodeGroupRole.name,
      policyArn: 'arn:aws:iam::aws:policy/AmazonEKS_CNI_Policy',
    });

    // Attach AmazonEC2ContainerRegistryReadOnly policy to the IAM role
    new IamRolePolicyAttachment(this, 'NodeGroupRolePolicyAttachment4', {
      role: nodeGroupRole.name,
      policyArn: 'arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore',
    });


    // Create an EKS node group
    new EksNodeGroup(this, 'NodeGroup', {
      clusterName: cluster.name,
      nodeGroupName: 'my-node-group',
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
    });

    // We create the Eks cluster within the module, this is so we can access the cluster resource afterwards
    this.eks = new dataAwsEksCluster.DataAwsEksCluster(this, 'eks-cluster', {
      name: cluster.name,
    });

    // We need to fetch the authentication data from the EKS cluster as well
    this.eksAuth = new dataAwsEksClusterAuth.DataAwsEksClusterAuth(
      this,
      'eks-auth',
      {
        name: cluster.name,
      }
    );

    // Add this after creating the EKS cluster
    new TerraformOutput(this, 'clusterName', {
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

    const exampleNamespace = new Namespace(this, 'tf-cdk-example', {
      metadata: {
        name: 'tf-cdk-example',
      },
    });

    const app = 'nginx-example';
    const nginx = new deployment.Deployment(this, 'nginx-deployment', {
      metadata: {
        name: app,
        namespace: exampleNamespace.metadata.name,
        labels: {
          app,
        },
      },
      spec: {
        replicas: '1',
        selector: {
          matchLabels: {
            app,
          },
        },
        template: {
          metadata: {
            labels: {
              app,
            },
          },
          spec: {
            container: [
              {
                image: 'nginx:1.7.8',
                name: 'example',
                port: [
                  {
                    containerPort: 80,
                  },
                ],
              },
            ],
          },
        },
      },
    });

    new service.Service(this, 'nginx-service', {
      metadata: {
        namespace: nginx.metadata.namespace,
        name: 'nginx-service',
      },
      spec: {
        selector: {
          app,
        },
        port: [
          {
            port: 80,
            targetPort: '80',
          },
        ],
        type: 'NodePort',
      },
    });
  }
}

const app = new App();
const stack = new MyStack(app, 'eks-app');

new KubernetesApplicationStack(app, 'applications', stack.eks, stack.eksAuth);

new CloudBackend(stack, {
  hostname: 'app.terraform.io',
  organization: 'fdervisi',
  workspaces: new NamedCloudWorkspace('eks-app'),
});
app.synth();
