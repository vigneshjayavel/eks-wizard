/**
 * ISecurityGroupIngress represents the configuration for ingress rules of a security group.
 */
export interface ISecurityGroupIngress {
  /**
   * Docs at Terraform Registry: {@link https://www.terraform.io/docs/providers/aws/r/security_group#cidr_blocks SecurityGroup#cidr_blocks}
   */
  cidrBlocks?: string[];

  /**
   * Description of the security group.
   * Docs at Terraform Registry: {@link https://www.terraform.io/docs/providers/aws/r/security_group#description SecurityGroup#description}
   */
  description?: string;

  /**
   * The starting range of the port for the TCP and UDP protocols, or an ICMP/ICMPv6 type number.
   * Docs at Terraform Registry: {@link https://www.terraform.io/docs/providers/aws/r/security_group#from_port SecurityGroup#from_port}
   */
  fromPort?: number;

  /**
   * The IPv6 CIDR block.
   * Docs at Terraform Registry: {@link https://www.terraform.io/docs/providers/aws/r/security_group#ipv6_cidr_blocks SecurityGroup#ipv6_cidr_blocks}
   */
  ipv6CidrBlocks?: string[];

  /**
   * The ID of the prefix list for an AWS service.
   * Docs at Terraform Registry: {@link https://www.terraform.io/docs/providers/aws/r/security_group#prefix_list_ids SecurityGroup#prefix_list_ids}
   */
  prefixListIds?: string[];

  /**
   * The protocol (tcp, udp, icmp, icmpv6, all).
   * Docs at Terraform Registry: {@link https://www.terraform.io/docs/providers/aws/r/security_group#protocol SecurityGroup#protocol}
   */
  protocol?: string;

  /**
   * The IDs of the security groups.
   * Docs at Terraform Registry: {@link https://www.terraform.io/docs/providers/aws/r/security_group#security_groups SecurityGroup#security_groups}
   */
  securityGroups?: string[];

  /**
   * The ending range of the port for the TCP and UDP protocols, or an ICMP/ICMPv6 code.
   * Docs at Terraform Registry: {@link https://www.terraform.io/docs/providers/aws/r/security_group#to_port SecurityGroup#to_port}
   */
  toPort?: number;
}

/**
 * ISecurityGroupEgress represents the configuration for egress rules of a security group.
 */
export interface ISecurityGroupEgress {
  /**
   * Docs at Terraform Registry: {@link https://www.terraform.io/docs/providers/aws/r/security_group#cidr_blocks SecurityGroup#cidr_blocks}
   */
  cidrBlocks?: string[];

  /**
   * Description of the security group.
   * Docs at Terraform Registry: {@link https://www.terraform.io/docs/providers/aws/r/security_group#description SecurityGroup#description}
   */
  description?: string;

  /**
   * The starting range of the port for the TCP and UDP protocols, or an ICMP/ICMPv6 type number.
   * Docs at Terraform Registry: {@link https://www.terraform.io/docs/providers/aws/r/security_group#from_port SecurityGroup#from_port}
   */
  fromPort?: number;

  /**
   * The IPv6 CIDR block.
   * Docs at Terraform Registry: {@link https://www.terraform.io/docs/providers/aws/r/security_group#ipv6_cidr_blocks SecurityGroup#ipv6_cidr_blocks}
   */
  ipv6CidrBlocks?: string[];

  /**
   * The ID of the prefix list for an AWS service.
   * Docs at Terraform Registry: {@link https://www.terraform.io/docs/providers/aws/r/security_group#prefix
   */
  prefixListIds?: string[];

  /**
   * The protocol (tcp, udp, icmp, icmpv6, all).
   * Docs at Terraform Registry: {@link https://www.terraform.io/docs/providers/aws/r/security_group#protocol SecurityGroup#protocol}
   */
  protocol?: string;

  /**
   * The IDs of the security groups.
   * Docs at Terraform Registry: {@link https://www.terraform.io/docs/providers/aws/r/security_group#security_groups SecurityGroup#security_groups}
   */
  securityGroups?: string[];

  /**
   * The ending range of the port for the TCP and UDP protocols, or an ICMP/ICMPv6 code.
   * Docs at Terraform Registry: {@link https://www.terraform.io/docs/providers/aws/r/security_group#to_port SecurityGroup#to_port}
   */
  toPort?: number;
}

/**
 * ISecurityGroup represents the configuration of an AWS Security Group.
 */
export interface ISecurityGroup {
  /**
   * Description of the security group.
   */
  description?: string;

  /**
   * The egress rules.
   * Docs at Terraform Registry: {@link https://www.terraform.io/docs/providers/aws/r/security_group#egress SecurityGroup#egress}
   */
  egress?: ISecurityGroupEgress[];

  /**
   * The ingress rules.
   * Docs at Terraform Registry: {@link https://www.terraform.io/docs/providers/aws/r/security_group#ingress SecurityGroup#ingress}
   */
  ingress?: ISecurityGroupIngress[];

  /**
   * Name of the security group.
   * Docs at Terraform Registry: {@link https://www.terraform.io/docs/providers/aws/r/security_group#name SecurityGroup#name}
   */
  name?: string;

  /**
   * Creates a unique name beginning with the specified prefix.
   * Docs at Terraform Registry: {@link https://www.terraform.io/docs/providers/aws/r/security_group#name_prefix SecurityGroup#name_prefix}
   */
  namePrefix?: string;

  /**
   * Instruct this module to revoke all of the security groups attached to the security group when destroying the security group.
   * Docs at Terraform Registry: {@link https://www.terraform.io/docs/providers/aws/r/security_group#revoke_rules_on_delete SecurityGroup#revoke_rules_on_delete}
   */
  revokeRulesOnDelete?: boolean;

  /**
   * Metadata to assign to the security group.
   * Docs at Terraform Registry: {@link https://www.terraform.io/docs/providers/aws/r/security_group#tags SecurityGroup#tags}
   */
  tags?: {
    [key: string]: string;
  };

  /**
   * The ID of the VPC.
   * Docs at Terraform Registry: {@link https://www.terraform.io/docs/providers/aws/r/security_group#vpc_id SecurityGroup#vpc_id}
   */
  vpcId?: string;
}
/**
 * IScalingConfig represents the desired, maximum, and minimum size for an AWS Autoscaling Group.
 */
export interface IScalingConfig {
  /**
   * The number of EC2 instances that should be running in the group.
   */
  desiredSize: number;

  /**
   * The maximum size of the Autoscaling Group.
   */
  maxSize: number;

  /**
   * The minimum size of the Autoscaling Group.
   */
  minSize: number;
}

/**
 * INodeGroup represents an Amazon EKS Node Group, which is a group of worker nodes.
 */
export interface INodeGroup {
  /**
   * The types of Amazon EC2 instances to use.
   */
  instanceTypes: string;

  /**
   * Scaling configuration of the Node Group.
   */
  scalingConfig: IScalingConfig;
}

/**
 * IEks represents the configuration for an Amazon EKS (Elastic Kubernetes Service) cluster.
 */
export interface IEks {
  /**
   * Name of the EKS cluster.
   */
  clusterName: string;

  /**
   * Kubernetes version to use for the EKS cluster.
   */
  version: string;

  /**
   * The Node Group configuration.
   */
  nodeGroup: INodeGroup;

  /**
   * Whether to create a Kubernetes application or not.
   * @default false
   */
  KubernetesApplication: boolean;
}

/**
 * IInstance represents an Amazon EC2 instance configuration.
 */
export interface IInstance {
  /**
   * The name of the instance.
   */
  name: string;

  /**
   * The type of the instance.
   */
  instanceType: string;

  /**
   * The Amazon Machine Image (AMI) ID of the instance.
   */
  ami: string;

  /**
   * Whether to associate a public IP address with an instance in a VPC.
   */
  associatePublicIpAddress: boolean;

  /**
   * Whether to enable Elastic IP (EIP).
   */
  eip: boolean;

  /**
   * The user data to provide when launching the instance.
   */
  userData: string;

  /**
   * The private DNS host name of the instance.
   */
  privatDnsHostName: string;

  /**
   * The name of the key pair.
   */
  keyName: string;

  /**
   * The security group configuration.
   */
  securityGroup: ISecurityGroup;

  /**
   * The name of the IAM instance profile associated with the instance.
   */
  iamInstanceProfile: string;
}

/**
 * ISubnets represents a subnet configuration in Amazon VPC (Virtual Private Cloud).
 */
export interface ISubnets {
  /**
   * The name of the subnet.
   */
  name: string;

  /**
   * Whether the subnet is public or private.
   */
  public: boolean;

  /**
   * The CIDR block for the subnet.
   */
  cidrBlock: string;

  /**
   * Whether to create an Amazon EKS for the subnet.
   */
  eks: boolean;

  /**
   * The availability zone where the subnet will be placed. Default is 0.
   */
  availabilityZone: number;

  /**
   * List of instances in the subnet.
   */
  instance?: IInstance[];
}
/**
 * IVpc represents a Virtual Private Cloud (VPC) configuration on AWS.
 */
export interface IVpc {
  /**
   * The CIDR block for the VPC.
   */
  cidrBlock: string;

  /**
   * The name of the VPC.
   */
  name: string;

  /**
   * The private hosted zone in the VPC.
   */
  privateHostedZone: string;

  /**
   * Optional EKS cluster in the VPC.
   */
  eks?: IEks;

  /**
   * Subnets within the VPC.
   */
  subnets: ISubnets[];
}

/**
 * ICloudServiceTree represents the overall structure of cloud services set up for a user.
 */
export interface ICloudServiceTree {
  /**
   * User ID of the owner of the cloud services.
   */
  userId: string;

  /**
   * The regions in which the cloud services are deployed.
   */
  regions: IRegion[];

  /**
   * The IAM Role associated with the services.
   */
  iamRole?: IIamRole;
}

/**
 * IS3 represents an Amazon S3 bucket configuration.
 */
export interface IS3 {
  /**
   * The name of the S3 bucket.
   */
  bucketName: string;

  /**
   * Whether to block public access to the S3 bucket.
   * @default true
   */
  blockPublicAccess: boolean;
}

/**
 * IRegion represents a geographical region in which cloud services are deployed.
 */
export interface IRegion {
  /**
   * The name of the region.
   */
  name: string;

  /**
   * The VPCs deployed in the region.
   */
  vpc: IVpc[];

  /**
   * The S3 buckets in the region.
   */
  s3: IS3;

  /**
   * Optional AWS Lambda S3 bucket in the region.
   */
  lamdaS3Bucket?: string;
}

/**
 * IIamRole represents an AWS IAM Role configuration.
 */
export interface IIamRole {
  /**
   * Map of AWS regions to the IAM policies for those regions.
   */
  [key: string]: IIamPolicy[];
}

/**
 * IIamPolicy represents an AWS IAM Policy configuration.
 */
export interface IIamPolicy {
  /**
   * The policy that determines who is allowed to assume the IAM role.
   */
  assumeRolePolicy: string;

  /**
   * The ARNs of the managed IAM policies to attach to the role.
   */
  policyArn?: string[];

  /**
   * Optional IAM policy templates in JSON format to attach to the role.
   */
  iamPolicyTemplateJson?: string[];
}
