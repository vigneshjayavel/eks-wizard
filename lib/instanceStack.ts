// Import required modules
import { Construct } from 'constructs';
import * as fs from 'fs';
import { IInstance } from './CloudServiceTreeInterface';
import { SecurityGroup } from '@cdktf/provider-aws/lib/security-group';
import { Instance } from '@cdktf/provider-aws/lib/instance';
import { Eip } from '@cdktf/provider-aws/lib/eip';

// Define an interface for instance stack configurations
interface InstanceStackConfig {
  instance: IInstance;
  userId: string;
  vpcId: string;
  subnetId: string;
}

// Define a class for Instance Stack
export class InstanceStack extends Construct {
  // Declare class variables
  private securityGroup: SecurityGroup;
  public instance: Instance;
  private userData: string = '';
  private eip: Eip;
  public privateDns: { ip?: string; hostname?: string } = {
    ip: '',
    hostname: '',
  };

  // Constructor for Instance Stack
  constructor(scope: Construct, id: string, config: InstanceStackConfig) {
    // Call the parent class's constructor
    super(scope, id);

    // If userData is provided in the config, read it into userData variable
    if (config.instance.userData) {
      this.userData = fs.readFileSync(config.instance.userData, 'utf8');
    }

    // Logging user data to console
    console.log('******* USERDATA ********');
    console.log(this.userData);
    console.log('******* USERDATA ********');

    // Create a new security group for the instance
    this.securityGroup = new SecurityGroup(
      this,
      `securityGroup${config.instance.name}`,
      {
        name: `security-group-instance-${config.instance.name}`,
        namePrefix: config.instance.securityGroup.namePrefix || undefined,
        vpcId: config.vpcId,
        description: config.instance.securityGroup.description || undefined,
        tags: config.instance.securityGroup.tags || undefined,
        ingress: config.instance.securityGroup.ingress || undefined,
        egress: config.instance.securityGroup.egress || undefined,
      }
    );

    // Create a new instance in the subnet with the specified configuration
    this.instance = new Instance(this, `instance-${config.instance.name}`, {
      ami: config.instance.ami,
      instanceType: config.instance.instanceType,
      subnetId: config.subnetId,
      iamInstanceProfile: config.instance.iamInstanceProfile || undefined,
      tags: {
        Name: `${config.instance.name}`,
        Owner: config.userId,
      },
      associatePublicIpAddress:
        config.instance.associatePublicIpAddress || undefined,
      keyName: config.instance.keyName,
      userData: this.userData, // Pass the user data to the instance
      vpcSecurityGroupIds: [this.securityGroup.id], // Attach the security group to the instance
    });

    // Create a new Elastic IP and associate it with the instance
    this.eip = new Eip(this, `eip${config.instance.name}`, {
      instance: this.instance.id,
      tags: {
        Name: `eip-${config.instance.name}`,
        Owner: config.userId,
      },
    });

    // Assign the Elastic IP and hostname to the private DNS
    this.privateDns = {
      ip: this.eip.publicIp,
      hostname: config.instance.privatDnsHostName,
    };
  }
}
