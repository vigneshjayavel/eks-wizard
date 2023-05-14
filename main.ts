import { Construct } from 'constructs';
import { App, TerraformStack, CloudBackend, NamedCloudWorkspace } from 'cdktf';
import { AwsProvider } from '@cdktf/provider-aws/lib/provider';
import * as fs from 'fs';
// import { Vpc } from '@cdktf/provider-aws/lib/vpc';
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

class MyStack extends TerraformStack {
  public instance: Instance;
  private userdata: string;
  private eip: Eip;
  constructor(scope: Construct, id: string) {
    super(scope, id);

    new AwsProvider(this, 'aws', { region: 'eu-south-1' });

    // const vpc = new Vpc(this, 'vpc', {
    //   cidrBlock: '10.0.0.0/20',
    //   tags: { Name: 'vpc', Owner: 'fdervisi' },
    // });

    const subnetMongoDb = new Subnet(this, 'subnet-MongoDB', {
      vpcId: 'vpc-094fa2f771bccdfe4',
      cidrBlock: '192.168.192.0/24',
      tags: { Name: 'subnet-MongoD', Owner: 'fdervisi' },
      //availabilityZone: 'eu-south-1a',
    });

    // const igw = new InternetGateway(this, 'igw', {
    //   vpcId: 'vpc-094fa2f771bccdfe4',
    // });

    const routeTable = new RouteTable(this, 'route-table', {
      vpcId: 'vpc-094fa2f771bccdfe4',
    });

    new RouteTableAssociation(this, 'route-table-association', {
      routeTableId: routeTable.id,
      subnetId: subnetMongoDb.id,
    });

    new Route(this, 'route-to-igw', {
      routeTableId: routeTable.id,
      gatewayId: 'igw-04baf8bd7a7b59b88',
      destinationCidrBlock: '0.0.0.0/0',
    });

    const securityGroupMgmt = new SecurityGroup(this, 'worker_group_mgmt_one', {
      namePrefix: 'worker_group_mgmt_one',
      vpcId: 'vpc-094fa2f771bccdfe4',

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
      subnetId: subnetMongoDb.id,
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
          vpcId: 'vpc-094fa2f771bccdfe4',
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
