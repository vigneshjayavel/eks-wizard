import { Construct } from 'constructs';
import { App, TerraformStack, CloudBackend, NamedCloudWorkspace } from 'cdktf';
import { AwsProvider } from '@cdktf/provider-aws/lib/provider';
import { Vpc } from './.gen/modules/vpc';
import { Instance } from '@cdktf/provider-aws/lib/instance';
import { dataAwsAvailabilityZones } from '@cdktf/provider-aws';
import { SecurityGroup } from '@cdktf/provider-aws/lib/security-group';

class MyStack extends TerraformStack {
  public vpc: Vpc;
  constructor(
    scope: Construct,
    id: string,
    clusterName: string,
    region: string
  ) {
    super(scope, id);

    new AwsProvider(this, 'aws', { region: region });

    const allAvailabilityZones =
      new dataAwsAvailabilityZones.DataAwsAvailabilityZones(
        this,
        'all-availability-zones',
        {}
      ).names;

    this.vpc = new Vpc(this, 'vpc', {
      name: 'vpc-eks-app',
      cidr: '10.0.0.0/16',
      azs: allAvailabilityZones,
      publicSubnets: ['10.0.1.0/24', '10.0.2.0/24', '10.0.3.0/24'],
      privateSubnets: [
        '10.0.4.0/24',
        '10.0.5.0/24',
        '10.0.6.0/24',
        '10.0.7.0/24',
      ],
      enableNatGateway: true,
      singleNatGateway: true,
      enableDnsHostnames: true,
      tags: {
        [`kubernetes.io/cluster/${clusterName}`]: 'shared',
      },
      publicSubnetTags: {
        [`kubernetes.io/cluster/${clusterName}`]: 'shared',
        'kubernetes.io/role/elb': '1',
      },
      privateSubnetTags: {
        [`kubernetes.io/cluster/${clusterName}`]: 'shared',
        'kubernetes.io/role/internal-elb': '1',
      },
    });

    const securityGroupMgmt = new SecurityGroup(this, 'worker_group_mgmt_one', {
      namePrefix: 'worker_group_mgmt_one',
      vpcId: this.vpc.vpcIdOutput,

      ingress: [
        {
          fromPort: 22,
          toPort: 22,
          protocol: 'tcp',

          cidrBlocks: ['0.0.0.0/0'],
        },
      ],
    });

    new Instance(this, 'instance', {
      subnetId: this.vpc.privateSubnetsOutput[3],
      instanceType: 't3a.micro',
      tags: { Name: 'MongoDB', Owner: 'fdervisi' },
      ami: 'ami-027f7881d2f6725e1',
      associatePublicIpAddress: true,
      securityGroups: [securityGroupMgmt.id],
      keyName: 'Key_MBP_fdervisi',
    });
  }
}

const app = new App();
const stack = new MyStack(app, 'eks-app', 'eks-app', 'eu-south-1');
new CloudBackend(stack, {
  hostname: 'app.terraform.io',
  organization: 'fdervisi',
  workspaces: new NamedCloudWorkspace('eks-app'),
});
app.synth();
