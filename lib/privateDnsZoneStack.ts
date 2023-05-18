import { Route53Record } from '@cdktf/provider-aws/lib/route53-record';
import { Route53Zone } from '@cdktf/provider-aws/lib/route53-zone';
import { Construct } from 'constructs';
interface PrivateDnsZoneStackConfig {
  privateDns: { ip?: string; hostname?: string }[];
  vpcId: string;
  userId: string;
}

export class PrivateDnsZoneStack extends Construct {
  constructor(scope: Construct, id: string, config: PrivateDnsZoneStackConfig) {
    super(scope, id);

    const privateHostedZone = new Route53Zone(this, 'route53-zone', {
      name: 'fdervisi.io',
      vpc: [
        {
          vpcId: config.vpcId,
        },
      ],
      tags: { Owner: config.userId },
    });

    config.privateDns.forEach((privateDns, index) => {
      if (privateDns.hostname && privateDns.ip) {
        new Route53Record(this, `route53-record-${index}`, {
          name: privateDns.hostname,
          type: 'A',
          zoneId: privateHostedZone.zoneId,
          ttl: 300,
          records: [privateDns.ip],
        });
      }
    });
  }
}
