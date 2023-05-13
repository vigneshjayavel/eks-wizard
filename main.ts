import { Construct } from 'constructs';
import { App, TerraformStack, CloudBackend, NamedCloudWorkspace } from 'cdktf';
import { AwsProvider } from '@cdktf/provider-aws/lib/provider';
import { Vpc } from '@cdktf/provider-aws/lib/vpc';
import { Subnet } from '@cdktf/provider-aws/lib/subnet';
import { InternetGateway } from '@cdktf/provider-aws/lib/internet-gateway';
import { RouteTable } from '@cdktf/provider-aws/lib/route-table';
import { Route } from '@cdktf/provider-aws/lib/route';
import { Instance } from '@cdktf/provider-aws/lib/instance';

class MyStack extends TerraformStack {
  constructor(scope: Construct, id: string) {
    super(scope, id);

    new AwsProvider(this, 'aws', { region: 'eu-south-1' });

    const vpc = new Vpc(this, 'vpc', {
      cidrBlock: '10.0.0.0/20',
      tags: { Name: 'eks-app' },
    });

    const subnetMongoDb = new Subnet(this, 'subnet-MongoDB', {
      vpcId: vpc.id,
      cidrBlock: '10.0.0.0/24',
      availabilityZone: 'eu-south-1a',
    });

    const igw = new InternetGateway(this, 'igw', { vpcId: vpc.id });

    const routeTable = new RouteTable(this, 'route-table', { vpcId: vpc.id });

    new Route(this, 'route-to-igw', {
      routeTableId: routeTable.id,
      gatewayId: igw.id,
      destinationCidrBlock: '0.0.0.0/0',
    });

    new Instance(this, 'instance', {
      subnetId: subnetMongoDb.id,
      instanceType: 't3a.micro',
      tags: { Name: 'MongoDB', Owner: 'fdervisi' },
      ami: 'ami-027f7881d2f6725e1',
      associatePublicIpAddress: true,
      keyName: 'Key_MBP_fdervisi',
    });
  }
}

const app = new App();
const stack = new MyStack(app, 'eks-app');
new CloudBackend(stack, {
  hostname: 'app.terraform.io',
  organization: 'fdervisi',
  workspaces: new NamedCloudWorkspace('eks-app'),
});
app.synth();
