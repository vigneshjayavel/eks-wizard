// Import necessary libraries
import { Construct } from 'constructs';
import { App, TerraformStack, CloudBackend, NamedCloudWorkspace } from 'cdktf';
import { AwsProvider } from '@cdktf/provider-aws/lib/provider';
import { cloudServiceTree } from './lib/cloudServiceTreeParser'; // Parser to transform cloud service tree into usable data structure
import { VpcStack } from './lib/vpcStack'; // Import VPC stack
import { IRegion } from './lib/CloudServiceTreeInterface'; // Interface for a region from cloud service tree
import { S3Stack } from './lib/s3Stack'; // Import S3 stack
import { LambdaStack } from './lib/lambdaStack'; // Import Lambda stack
import { IamStack } from './lib/iamStack'; // Import IAM stack

// Config interface for a region stack
interface RegionStackConfig {
  region: IRegion;
}

// Create class for Region Stack
class RegionStack extends TerraformStack {
  private vpc!: VpcStack; // Declare a VPC stack
  constructor(scope: Construct, id: string, config: RegionStackConfig) {
    super(scope, id); // Call parent constructor
    // Instantiate AWS Provider for the region
    new AwsProvider(this, `aws-${config.region.name}`, {
      region: config.region.name,
    });

    // If the region has an S3 service, create an S3 stack
    if (config.region.s3) {
      new S3Stack(this, `s3-${config.region.name}`, {
        s3: config.region.s3,
        userId: cloudServiceTree.userId,
      });
    }

    // Create VPC and Lambda stacks for each VPC item in the region
    config.region.vpc.forEach((vpcItem) => {
      // Create a VPC stack for each VPC item in the region
      this.vpc = new VpcStack(this, `vpc-stack-${config.region.name}`, {
        userId: cloudServiceTree.userId,
        vpc: vpcItem,
        eks: vpcItem.eks,
        s3BucketName: config.region.s3.bucketName,
      });

      // If there's an S3 bucket for Lambda, create a Lambda stack
      if (config.region.lamdaS3Bucket) {
        new LambdaStack(this, `lambda-stack-${config.region.name}`, {
          s3BucketName: config.region.s3.bucketName,
          lamdaS3Bucket: config.region.lamdaS3Bucket,
          targetIp: this.vpc.privateDns[0].ip || '',
          userId: cloudServiceTree.userId,
        });
      }
    });
  }
}

// Create a new CDKTF App
const app = new App();

// If an IAM role is defined in the cloud service tree, create an IAM stack
if (cloudServiceTree.iamRole) {
  console.log('iamRole', cloudServiceTree.iamRole);
  new IamStack(app, `iamstack`, {
    iamRole: cloudServiceTree.iamRole,
    userId: cloudServiceTree.userId,
  });
  // // Define a Cloud Backend for the IAM stack with a named workspace
  // new CloudBackend(iamStack, {
  //   hostname: 'app.terraform.io',
  //   organization: 'fdervisi',
  //   workspaces: new NamedCloudWorkspace(`eks-app-iam-stack`),
  // });
}

// For each region defined in the cloud service tree, create a RegionStack
cloudServiceTree.regions.forEach((regionItem) => {
  const regionStack = new RegionStack(app, `eks-app-stack-${regionItem.name}`, {
    region: regionItem,
  });
  // Define a Cloud Backend for the RegionStack with a named workspace
  new CloudBackend(regionStack, {
    hostname: 'app.terraform.io',
    organization: 'fdervisi',
    workspaces: new NamedCloudWorkspace(`eks-app-stack-${regionItem.name}`),
  });
});

// Synthesize the app to produce the Terraform JSON
app.synth();
