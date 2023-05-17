import { Construct } from 'constructs';
import { Fn } from 'cdktf';
import { IVpc } from './CloudServiceTreeInterface';
import { Vpc } from '@cdktf/provider-aws/lib/vpc';
import { dataAwsAvailabilityZones } from '@cdktf/provider-aws';
import { Subnet } from '@cdktf/provider-aws/lib/subnet';
import { InternetGateway } from '@cdktf/provider-aws/lib/internet-gateway';
import { NatGateway } from '@cdktf/provider-aws/lib/nat-gateway';
import { Eip } from '@cdktf/provider-aws/lib/eip';
import { RouteTable } from '@cdktf/provider-aws/lib/route-table';
import { RouteTableAssociation } from '@cdktf/provider-aws/lib/route-table-association';

interface NetworkStackConfig {
  vpc: IVpc;
  userId: string;
  eksCluster?: string;
}

export class NetworkStack extends Construct {
  public vpc: Vpc;
  public subnets: Subnet[] = [];
  private allAvailabilityZones: string[];
  public igw: InternetGateway;
  public natGw: NatGateway;
  private eipNat: Eip;
  private natGwPublicSubnet: Subnet;
  private routeTablePublic: RouteTable;
  private routeTablePrivate: RouteTable;

  constructor(scope: Construct, id: string, config: NetworkStackConfig) {
    super(scope, id);

    this.allAvailabilityZones =
      new dataAwsAvailabilityZones.DataAwsAvailabilityZones(
        this,
        `all-availability-zones-${config.vpc.name}`,
        {}
      ).names;

    this.vpc = new Vpc(this, `vpc-${config.vpc.name}`, {
      cidrBlock: config.vpc.cidrBlock,
      enableDnsHostnames: true,
      tags: { Name: config.vpc.name, Owner: config.userId },
    });

    this.igw = new InternetGateway(this, 'igw', {
      vpcId: this.vpc.id,
      tags: {
        Name: `igw-${config.vpc.name}`,
        Owner: config.userId,
      },
    });

    this.eipNat = new Eip(this, `eip-nat-${config.vpc.name}`, {
      tags: {
        Name: 'eip-natGw-${config.vpc.name}',
        Owner: config.userId,
      },
    });

    this.natGwPublicSubnet = new Subnet(
      this,
      `natGwPublicSubnet-${config.vpc.name}`,
      {
        cidrBlock: config.vpc.cidrBlock.slice(0, -2) + '24',
        vpcId: this.vpc.id,
      }
    );

    this.natGw = new NatGateway(this, `natGw-${config.vpc.name}`, {
      allocationId: this.eipNat.id,
      subnetId: this.natGwPublicSubnet.id,
      tags: {
        Name: 'natGw-${config.vpc.name}',
        Owner: config.userId,
      },
    });

    this.routeTablePublic = new RouteTable(
      this,
      `route-table-public-subnet-${config.vpc.name}`,
      {
        vpcId: this.vpc.id,
        tags: {
          Name: 'route-table-eks-app-public-subnet',
          Owner: config.userId,
        },
      }
    );

    this.routeTablePrivate = new RouteTable(
      this,
      `route-table-private-subnet-${config.vpc.name}`,
      {
        vpcId: this.vpc.id,
        tags: {
          Name: 'route-table-eks-app-public-subnet',
          Owner: config.userId,
        },
      }
    );

    config.vpc.subnets.forEach((subnetconfig, i) => {
      let tags;
      if (subnetconfig.eks && subnetconfig.public) {
        tags = {
          [`kubernetes.io/cluster/${config.eksCluster}`]: `shared`,
          'kubernetes.io/role/elb': '1',
          Owner: config.userId,
        };
      } else {
        tags = {
          [`kubernetes.io/cluster/${config.eksCluster}`]: 'shared',
          'kubernetes.io/role/internal-elb': '1',
          Owner: config.userId,
        };
      }
      const availabilityZoneIndex = i % this.allAvailabilityZones.length;
      const subnet = new Subnet(this, subnetconfig.name, {
        vpcId: this.vpc.id,
        cidrBlock: subnetconfig.cidrBlock,
        tags: tags,
        availabilityZone: Fn.element(
          this.allAvailabilityZones,
          availabilityZoneIndex
        ),
      });

      if (subnetconfig.public) {
        new RouteTableAssociation(
          this,
          `route-table-association-public-${config.vpc.name}${i}`,
          {
            routeTableId: this.routeTablePublic.id,
            subnetId: subnet.id,
          }
        );
      } else {
        new RouteTableAssociation(
          this,
          `route-table-association-private-${config.vpc.name}${i}`,
          {
            routeTableId: this.routeTablePrivate.id,
            subnetId: subnet.id,
          }
        );
      }

      this.subnets.push(subnet);
    });
  }
}
