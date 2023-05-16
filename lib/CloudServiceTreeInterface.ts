interface IScalingConfig {
  desiredSize: number;
  maxSize: number;
  minSize: number;
}

interface INodeGroup {
  instanceTypes: string;
  scalingConfig: IScalingConfig;
}

interface IEks {
  clusterName: string;
  version: string;
  nodeGroup: INodeGroup;
}

interface IInstance {
  name: string;
  instanceType: string;
  ami: string;
  associatePublicIpAddress: boolean;
  eip: boolean;
  userData: string;
  keyName: string;
}

interface Subnet {
  name: string;
  type: string;
  cidrBlock: string;
  tags: {
    [key: string]: string;
  };
  instance?: IInstance[];
}

interface IVpc {
  cidrBlock: string;
  name: string;
  privateHostedZone: string;
  eks?: IEks;
  subnet: Subnet[];
}

export interface ICloudServiceTree {
  userId: string;
  region: string;
  vpc: IVpc;
}
