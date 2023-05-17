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
}

export interface IInstance {
  name: string;
  instanceType: string;
  ami: string;
  associatePublicIpAddress: boolean;
  eip: boolean;
  userData: string;
  keyName: string;
}

export interface ISubnets {
  name: string;
  public: boolean;
  cidrBlock: string;
  eks: boolean;
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
  userId: string;
  region: string;
  vpc: IVpc;
}
