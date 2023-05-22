import { Construct } from 'constructs';
import * as fs from 'fs';
import { IInstance } from './CloudServiceTreeInterface';
import { SecurityGroup } from '@cdktf/provider-aws/lib/security-group';
import { Instance } from '@cdktf/provider-aws/lib/instance';
import { Eip } from '@cdktf/provider-aws/lib/eip';

interface InstanceStackConfig {
  instance: IInstance;
  userId: string;
  vpcId: string;
  subnetId: string;
}

export class InstanceStack extends Construct {
  private securityGroup: SecurityGroup;
  public instance: Instance;
  private userData: string = '';
  private eip: Eip;
  public privateDns: { ip?: string; hostname?: string } = {
    ip: '',
    hostname: ''
  };

  constructor(scope: Construct, id: string, config: InstanceStackConfig) {
    super(scope, id);

    if (config.instance.userData) {
      this.userData = fs.readFileSync(config.instance.userData, 'utf8');
    }

    console.log("******* USERDATA ********")
    console.log(this.userData)
    console.log('******* USERDATA ********');
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
      // iamInstanceProfile:
      //   config.region.userId + '-' + config.instance.iamInstanceProfile ||
      //   undefined, // IAM instance profile to associate with the instance
      userData: this.userData, // user data to pass to the instance
      vpcSecurityGroupIds: [this.securityGroup.id],
    });

    this.eip = new Eip(this, `eip${config.instance.name}`, {
      instance: this.instance.id,
      tags: {
        Name: `eip-${config.instance.name}`,
        Owner: config.userId,
      },
    });

    // if (config.instance.privatDnsHostName) {
      this.privateDns = {
        ip: this.eip.publicIp,
        hostname: config.instance.privatDnsHostName,
      };
    // }
  }
}
