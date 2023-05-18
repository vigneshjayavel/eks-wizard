export interface ISecurityGroupIngress {
  /**
   * Docs at Terraform Registry: {@link https://www.terraform.io/docs/providers/aws/r/security_group#cidr_blocks SecurityGroup#cidr_blocks}
   */
  cidrBlocks?: string[];
  /**
   * Docs at Terraform Registry: {@link https://www.terraform.io/docs/providers/aws/r/security_group#description SecurityGroup#description}
   */
  description?: string;
  /**
   * Docs at Terraform Registry: {@link https://www.terraform.io/docs/providers/aws/r/security_group#from_port SecurityGroup#from_port}
   */
  fromPort?: number;
  /**
   * Docs at Terraform Registry: {@link https://www.terraform.io/docs/providers/aws/r/security_group#ipv6_cidr_blocks SecurityGroup#ipv6_cidr_blocks}
   */
  ipv6CidrBlocks?: string[];
  /**
   * Docs at Terraform Registry: {@link https://www.terraform.io/docs/providers/aws/r/security_group#prefix_list_ids SecurityGroup#prefix_list_ids}
   */
  prefixListIds?: string[];
  /**
   * Docs at Terraform Registry: {@link https://www.terraform.io/docs/providers/aws/r/security_group#protocol SecurityGroup#protocol}
   */
  protocol?: string;
  /**
   * Docs at Terraform Registry: {@link https://www.terraform.io/docs/providers/aws/r/security_group#security_groups SecurityGroup#security_groups}
   */
  securityGroups?: string[];
  /**
   * Docs at Terraform Registry: {@link https://www.terraform.io/docs/providers/aws/r/security_group#to_port SecurityGroup#to_port}
   */
  toPort?: number;
}

export interface ISecurityGroupEgress {
  /**
   * Docs at Terraform Registry: {@link https://www.terraform.io/docs/providers/aws/r/security_group#cidr_blocks SecurityGroup#cidr_blocks}
   */
  cidrBlocks?: string[];
  /**
   * Docs at Terraform Registry: {@link https://www.terraform.io/docs/providers/aws/r/security_group#description SecurityGroup#description}
   */
  description?: string;
  /**
   * Docs at Terraform Registry: {@link https://www.terraform.io/docs/providers/aws/r/security_group#from_port SecurityGroup#from_port}
   */
  fromPort?: number;
  /**
   * Docs at Terraform Registry: {@link https://www.terraform.io/docs/providers/aws/r/security_group#ipv6_cidr_blocks SecurityGroup#ipv6_cidr_blocks}
   */
  ipv6CidrBlocks?: string[];
  /**
   * Docs at Terraform Registry: {@link https://www.terraform.io/docs/providers/aws/r/security_group#prefix_list_ids SecurityGroup#prefix_list_ids}
   */
  prefixListIds?: string[];
  /**
   * Docs at Terraform Registry: {@link https://www.terraform.io/docs/providers/aws/r/security_group#protocol SecurityGroup#protocol}
   */
  protocol?: string;
  /**
   * Docs at Terraform Registry: {@link https://www.terraform.io/docs/providers/aws/r/security_group#security_groups SecurityGroup#security_groups}
   */
  securityGroups?: string[];
  /**
   * Docs at Terraform Registry: {@link https://www.terraform.io/docs/providers/aws/r/security_group#to_port SecurityGroup#to_port}
   */
  toPort?: number;
}

export interface ISecurityGroup {
  description?: string;
  /**
   * Docs at Terraform Registry: {@link https://www.terraform.io/docs/providers/aws/r/security_group#egress SecurityGroup#egress}
   */
  egress?: ISecurityGroupEgress[];
  /**
   * Docs at Terraform Registry: {@link https://www.terraform.io/docs/providers/aws/r/security_group#ingress SecurityGroup#ingress}
   */
  ingress?: ISecurityGroupIngress[];
  /**
   * Docs at Terraform Registry: {@link https://www.terraform.io/docs/providers/aws/r/security_group#name SecurityGroup#name}
   */
  name?: string;
  /**
   * Docs at Terraform Registry: {@link https://www.terraform.io/docs/providers/aws/r/security_group#name_prefix SecurityGroup#name_prefix}
   */
  namePrefix?: string;
  /**
   * Docs at Terraform Registry: {@link https://www.terraform.io/docs/providers/aws/r/security_group#revoke_rules_on_delete SecurityGroup#revoke_rules_on_delete}
   */
  revokeRulesOnDelete?: boolean;
  /**
   * Docs at Terraform Registry: {@link https://www.terraform.io/docs/providers/aws/r/security_group#tags SecurityGroup#tags}
   */
  tags?: {
    [key: string]: string;
  };
  /**
   * Docs at Terraform Registry: {@link https://www.terraform.io/docs/providers/aws/r/security_group#vpc_id SecurityGroup#vpc_id}
   */
  vpcId?: string;
}

export interface IScalingConfig {
  desiredSize: number;
  maxSize: number;
  minSize: number;
}

export interface INodeGroup {
  instanceTypes: string;
  scalingConfig: IScalingConfig;
}

export interface IEks {
  clusterName: string;
  version: string;
  nodeGroup: INodeGroup;
  /**
   * @default false
   */
  KubernetesApplication: boolean;
}

export interface IInstance {
  name: string;
  instanceType: string;
  ami: string;
  associatePublicIpAddress: boolean;
  eip: boolean;
  userData: string;
  privatDnsHostName: string;
  keyName: string;
  securityGroup: ISecurityGroup;
}

export interface ISubnets {
  name: string;
  public: boolean;
  cidrBlock: string;
  eks: boolean;
  /**
   * @default 0
   */
  availabilityZone: number;
  instance?: IInstance[];
}

export interface IVpc {
  cidrBlock: string;
  name: string;
  privateHostedZone: string;
  eks?: IEks;
  subnets: ISubnets[];
}

export interface ICloudServiceTree {
  s3: IS3;
  userId: string;
  regions: IRegion[];
}

export interface IS3 {
  bucketName: string;
}

export interface IRegion {
  name: string;
  vpc: IVpc[];
}
