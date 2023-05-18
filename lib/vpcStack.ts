import { Construct } from 'constructs';
import { Fn } from 'cdktf';
import { IEks, IVpc } from './CloudServiceTreeInterface';
import { Vpc } from '@cdktf/provider-aws/lib/vpc';
import { dataAwsAvailabilityZones } from '@cdktf/provider-aws';
import { Subnet } from '@cdktf/provider-aws/lib/subnet';
import { InternetGateway } from '@cdktf/provider-aws/lib/internet-gateway';
import { NatGateway } from '@cdktf/provider-aws/lib/nat-gateway';
import { Eip } from '@cdktf/provider-aws/lib/eip';
import { RouteTable } from '@cdktf/provider-aws/lib/route-table';
import { RouteTableAssociation } from '@cdktf/provider-aws/lib/route-table-association';
import { InstanceStack } from './instanceStack';
import { PrivateDnsZoneStack } from './privateDnsZoneStack';
import { EksStack } from './eksStack';
import { KubernetesApplicationStack } from './kubernetesApplicationStack';
import { Route } from '@cdktf/provider-aws/lib/route';

interface VpcStackConfig {
  vpc: IVpc;
  userId: string;
  eks?: IEks;
}

export class VpcStack extends Construct {
  private vpc: Vpc;
  public subnets: Subnet[] = [];
  private eksSubnets: string[] = [];
  private allAvailabilityZones: string[];
  public igw: InternetGateway;
  public natGw: NatGateway;
  private eipNat: Eip;
  private natGwPublicSubnet: Subnet;
  private routeTablePublic: RouteTable;
  private routeTablePrivate: RouteTable;
  public privateDns: { ip?: string; hostname?: string }[] = [];
  get id(): string {
    return this.vpc.id;
  }

  constructor(scope: Construct, id: string, config: VpcStackConfig) {
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
        Name: `eip-natGw-${config.vpc.name}`,
        Owner: config.userId,
      },
    });

    this.natGwPublicSubnet = new Subnet(
      this,
      `natGwPublicSubnet-${config.vpc.name}`,
      {
        cidrBlock: config.vpc.cidrBlock.slice(0, -2) + '24',
        vpcId: this.vpc.id,
        tags: {
          Name: `subnet-natGw-public-${config.vpc.name}`,
          Owner: config.userId,
        },
      }
    );

    this.natGw = new NatGateway(this, `natGw-${config.vpc.name}`, {
      allocationId: this.eipNat.id,
      subnetId: this.natGwPublicSubnet.id,
      tags: {
        Name: `natGw-${config.vpc.name}`,
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
          Name: 'route-table-eks-app-private-subnet',
          Owner: config.userId,
        },
      }
    );

    new Route(this, `route-to-igw-${config.vpc.name}`, {
      routeTableId: this.routeTablePublic.id,
      gatewayId: this.igw.id,
      destinationCidrBlock: '0.0.0.0/0',
    });

    new Route(this, `route-to-natGw-${config.vpc.name}`, {
      routeTableId: this.routeTablePrivate.id,
      natGatewayId: this.natGw.id,
      destinationCidrBlock: '0.0.0.0/0',
    });

    new RouteTableAssociation(
      this,
      `route-table-association-natGw-public-${config.vpc.name}`,
      {
        routeTableId: this.routeTablePublic.id,
        subnetId: this.natGwPublicSubnet.id,
      }
    );

    config.vpc.subnets.forEach((subnetItem, i) => {
      let tags;
      if (subnetItem.eks && subnetItem.public) {
        tags = {
          [`kubernetes.io/cluster/${config.eks?.clusterName}`]: `shared`,
          'kubernetes.io/role/elb': '1',
          Owner: config.userId,
        };
      } else {
        tags = {
          [`kubernetes.io/cluster/${config.eks?.clusterName}`]: 'shared',
          'kubernetes.io/role/internal-elb': '1',
          Name: subnetItem.name,
          Owner: config.userId,
        };
      }

      const subnet = new Subnet(this, subnetItem.name, {
        vpcId: this.vpc.id,
        cidrBlock: subnetItem.cidrBlock,
        tags: tags,
        availabilityZone: Fn.element(
          this.allAvailabilityZones,
          subnetItem.availabilityZone
        ),
      });

      if (subnetItem.public) {
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

      if (subnetItem.instance) {
        subnetItem.instance.forEach((instanceItem) => {
          const instance = new InstanceStack(
            this,
            `instance-${instanceItem.name}`,
            {
              userId: config.userId,
              subnetId: subnet.id,
              vpcId: this.vpc.id,
              instance: instanceItem,
            }
          );
          if (instance?.privateDns) {
            this.privateDns.push(instance.privateDns);
          }
        });
      }
      this.subnets.push(subnet);
      if (subnetItem.eks) {
        this.eksSubnets.push(subnet.id);
      }
    });

    if (config.eks) {
      const eksStack = new EksStack(this, `eks-stack-${config.vpc.name}$`, {
        eks: config.eks,
        subnetIds: this.eksSubnets,
        userId: config.userId,
        vpcId: this.vpc.id,
      });

      if (config.eks.KubernetesApplication) {
        new KubernetesApplicationStack(this, 'applications', {
          cluster: eksStack.eks,
          userId: config.userId,
          clusterAuth: eksStack.eksAuth,
        });
      }
    }

    new PrivateDnsZoneStack(this, `private-dns-zone-${config.vpc.name}$`, {
      vpcId: this.vpc.id,
      privateDns: this.privateDns,
      userId: config.userId,
    });
  }
}
