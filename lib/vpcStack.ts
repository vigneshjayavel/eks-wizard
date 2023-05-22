// Import necessary modules for the CDK construct
import { Construct } from 'constructs';
import { Fn, TerraformOutput } from 'cdktf';
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

// Define a TypeScript interface for the VPC configuration
interface VpcStackConfig {
  vpc: IVpc;
  userId: string;
  eks?: IEks;
  s3BucketName: string;
}

// Create a new VPC stack class which extends the Construct class from the CDK
export class VpcStack extends Construct {
  // Define class level variables
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

  // Define getter to retrieve VPC ID
  get id(): string {
    return this.vpc.id;
  }

  // Define the constructor for the VPC Stack
  constructor(scope: Construct, id: string, config: VpcStackConfig) {
    super(scope, id);

    // Fetch all available AWS zones for use in subnet creation
    this.allAvailabilityZones =
      new dataAwsAvailabilityZones.DataAwsAvailabilityZones(
        this,
        `all-availability-zones-${config.vpc.name}`,
        {}
      ).names;

    // Create a new VPC
    this.vpc = new Vpc(this, `vpc-${config.vpc.name}`, {
      cidrBlock: config.vpc.cidrBlock,
      enableDnsHostnames: true,
      tags: { Name: config.vpc.name, Owner: config.userId },
    });

    // Create a new Internet Gateway and attach it to the VPC
    this.igw = new InternetGateway(this, 'igw', {
      vpcId: this.vpc.id,
      tags: {
        Name: `igw-${config.vpc.name}`,
        Owner: config.userId,
      },
    });

    // Create a new Elastic IP for the NAT Gateway
    this.eipNat = new Eip(this, `eip-nat-${config.vpc.name}`, {
      tags: {
        Name: `eip-natGw-${config.vpc.name}`,
        Owner: config.userId,
      },
    });
    // Create a public subnet for the NAT Gateway
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

    // Create a new NAT Gateway and attach the EIP and the public subnet
    this.natGw = new NatGateway(this, `natGw-${config.vpc.name}`, {
      allocationId: this.eipNat.id,
      subnetId: this.natGwPublicSubnet.id,
      tags: {
        Name: `natGw-${config.vpc.name}`,
        Owner: config.userId,
      },
    });

    // Create a new route table for the public subnet
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

    // Create a new route table for the private subnet
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

    // Add a route to the Internet Gateway in the public route table
    new Route(this, `route-to-igw-${config.vpc.name}`, {
      routeTableId: this.routeTablePublic.id,
      gatewayId: this.igw.id,
      destinationCidrBlock: '0.0.0.0/0',
    });

    // Add a route to the NAT Gateway in the private route table
    new Route(this, `route-to-natGw-${config.vpc.name}`, {
      routeTableId: this.routeTablePrivate.id,
      natGatewayId: this.natGw.id,
      destinationCidrBlock: '0.0.0.0/0',
    });

    // Associate the NAT Gateway's subnet with the public route table
    new RouteTableAssociation(
      this,
      `route-table-association-natGw-public-${config.vpc.name}`,
      {
        routeTableId: this.routeTablePublic.id,
        subnetId: this.natGwPublicSubnet.id,
      }
    );

    // Loop over each subnet in the VPC configuration to create subnet, associate with route table and create instances if needed
    config.vpc.subnets.forEach((subnetItem, i) => {
      // Logic to decide the tags for the subnet
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
      // Create subnet
      const subnet = new Subnet(this, subnetItem.name, {
        vpcId: this.vpc.id,
        cidrBlock: subnetItem.cidrBlock,
        tags: tags,
        availabilityZone: Fn.element(
          this.allAvailabilityZones,
          subnetItem.availabilityZone
        ),
      });

      // If subnet is public, associate with public route table
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
        // If subnet is private, associate with private route table
        new RouteTableAssociation(
          this,
          `route-table-association-private-${config.vpc.name}${i}`,
          {
            routeTableId: this.routeTablePrivate.id,
            subnetId: subnet.id,
          }
        );
      }

      // If subnet is linked to an instance, create the instance
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
      // Add this subnet to the list of subnets
      this.subnets.push(subnet);
      // If the subnet is linked to EKS, add to the list of EKS subnets
      if (subnetItem.eks) {
        this.eksSubnets.push(subnet.id);
      }
    });

    // If VPC is linked to EKS, create the EKS stack
    if (config.eks) {
      const eksStack = new EksStack(this, `eks-stack-${config.vpc.name}$`, {
        eks: config.eks,
        subnetIds: this.eksSubnets,
        userId: config.userId,
        vpcId: this.vpc.id,
      });

      // Output the EKS cluster name
      new TerraformOutput(this, 'eks-cluster-name', {
        value: eksStack.eks.name,
      });

      // Output the EKS cluster endpoint
      new TerraformOutput(this, 'eks-cluster-endpoint', {
        value: eksStack.eks.endpoint,
      });

      // If EKS has a Kubernetes application, create the Kubernetes application stack
      if (config.eks.KubernetesApplication) {
        new KubernetesApplicationStack(
          this,
          `kubernete-applications-${config.vpc.name}$`,
          {
            cluster: eksStack.eks,
            userId: config.userId,
            clusterAuth: eksStack.eksAuth,
          }
        );
      }
    }

    // Create a private DNS zone stack
    new PrivateDnsZoneStack(this, `private-dns-zone-${config.vpc.name}$`, {
      vpcId: this.vpc.id,
      zoneDomainName: config.vpc.privateHostedZone,
      privateDns: this.privateDns,
      userId: config.userId,
    });
  }
}
