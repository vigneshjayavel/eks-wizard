// Import necessary AWS components from the AWS Construct Library
import { Route53Record } from '@cdktf/provider-aws/lib/route53-record';
import { Route53Zone } from '@cdktf/provider-aws/lib/route53-zone';
import { Construct } from 'constructs';

// Define the interface for the stack configuration
interface PrivateDnsZoneStackConfig {
  privateDns: { ip?: string; hostname?: string }[]; // List of private DNS records
  vpcId: string; // The ID of the VPC where the private DNS zone should be created
  userId: string; // The ID of the user
  zoneDomainName: string; // The domain name for the DNS zone
}

// Define the stack for creating a private DNS zone in Route53
export class PrivateDnsZoneStack extends Construct {
  // Define the constructor that will be called when a new stack is created
  constructor(scope: Construct, id: string, config: PrivateDnsZoneStackConfig) {
    super(scope, id);

    // Create a new private hosted zone in Route53
    const privateHostedZone = new Route53Zone(
      this,
      `route53-zone-${config.zoneDomainName}`, // The id of the private hosted zone resource
      {
        name: config.zoneDomainName, // The domain name for the DNS zone
        vpc: [
          {
            vpcId: config.vpcId, // The ID of the VPC where the private DNS zone should be created
          },
        ],
        tags: { Owner: config.userId }, // The owner of the DNS zone
      }
    );

    // For each private DNS record in the configuration
    config.privateDns.forEach((privateDns, index) => {
      // If both the hostname and IP are provided for the record
      if (privateDns.hostname && privateDns.ip) {
        // Create a new DNS record in the private hosted zone
        new Route53Record(
          this,
          `route53-record--${config.zoneDomainName}${index}`, // The id of the Route53 record resource
          {
            name: privateDns.hostname, // The hostname for the DNS record
            type: 'A', // The type of DNS record (A for IPv4 address)
            zoneId: privateHostedZone.zoneId, // The ID of the zone where the record should be created
            ttl: 300, // The time-to-live (TTL) for the DNS record (in seconds)
            records: [privateDns.ip], // The IP address for the DNS record
          }
        );
      }
    });
  }
}
