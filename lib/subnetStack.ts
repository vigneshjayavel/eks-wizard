import { Subnet } from '@cdktf/provider-aws/lib/subnet';
import { dataAwsAvailabilityZones } from '@cdktf/provider-aws';
import { Fn } from 'cdktf';
import { InstanceStack } from './instanceStack';
import { Construct } from 'constructs';
interface SubnetStackConfig {
  targetIp: string;
  s3BucketName: string;
  userId: string;
}

export class SubnetStack extends Construct {
  private allAvailabilityZones: string[];
  constructor(scope: Construct, id: string, config: SubnetStackConfig) {
    super(scope, id);

    this.allAvailabilityZones =
      new dataAwsAvailabilityZones.dataAwsAvailabilityZones(
        this,
        `all-availability-zones-${config.vpc.name}`,
        {}
      ).names;

      
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
  }
}
