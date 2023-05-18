import { Construct } from 'constructs';
import { App, TerraformStack, CloudBackend, NamedCloudWorkspace } from 'cdktf';
import { AwsProvider } from '@cdktf/provider-aws/lib/provider';
import { cloudServiceTree } from './lib/cloudServiceTreeParser';
import { VpcStack } from './lib/vpcStack';
import { IRegion } from './lib/CloudServiceTreeInterface';
//import { S3Bucket } from '@cdktf/provider-aws/lib/s3-bucket';
// import { S3BucketPublicAccessBlock } from '@cdktf/provider-aws/lib/s3-bucket-public-access-block';

interface EksStackConfig {
  region: IRegion;
}

class EksStack extends TerraformStack {
  // public vpc: VpcStack;
  constructor(scope: Construct, id: string, config: EksStackConfig) {
    super(scope, id);

    new AwsProvider(this, 'aws', { region: config.region.name });

    config.region.vpc.forEach((vpcItem) => {
      new VpcStack(this, 'network', {
        userId: cloudServiceTree.userId,
        vpc: vpcItem,
        eks: vpcItem.eks,
      });
    });

    // new S3Bucket(this, 'bucket', { bucket: cloudServiceTree.s3.bucketName });

    // new S3BucketPublicAccessBlock(this, 'block', {
    //   blockPublicAcls: true,
    //   blockPublicPolicy: true,
    //   ignorePublicAcls: true,
    //   restrictPublicBuckets: true,
    //   bucket: cloudServiceTree.s3.bucketName,
    // });
  }
}

const app = new App();

cloudServiceTree.regions.forEach((regionItem) => {
  const eksStack = new EksStack(app, 'eks-app', { region: regionItem });
  new CloudBackend(eksStack, {
    hostname: 'app.terraform.io',
    organization: 'fdervisi',
    workspaces: new NamedCloudWorkspace('eks-app'),
  });
});

app.synth();
