// Import all the necessary classes from the AWS CDKTF and Constructs libraries.
import { TerraformStack } from 'cdktf';
import * as fs from 'fs';
import { IamPolicy } from '@cdktf/provider-aws/lib/iam-policy';
import { AwsProvider } from '@cdktf/provider-aws/lib/provider';
import { Construct } from 'constructs';
import { IamPolicyAttachment } from '@cdktf/provider-aws/lib/iam-policy-attachment';
import { IamRole } from '@cdktf/provider-aws/lib/iam-role';
import { IIamRole } from './CloudServiceTreeInterface';
import { IamInstanceProfile } from '@cdktf/provider-aws/lib/iam-instance-profile';

// Define a custom interface for IAM Stack configuration.
interface IamStackConfig {
  iamRole: IIamRole;
  userId: string;
}

// A class to create IAM roles, policies, and instance profiles.
export class IamStack extends TerraformStack {
  constructor(scope: Construct, id: string, config: IamStackConfig) {
    super(scope, id);

    // Define the AWS provider for the stack, in this case, it's 'us-east-1' region.
    new AwsProvider(this, 'AWS', { region: 'us-east-1' });

    // Iterate over the roles in the provided IAM role configuration.
    for (const key of Object.keys(config.iamRole)) {
      for (const role of Object.values(config.iamRole[key])) {
        // Load the assume role policy from the provided JSON file.
        const assumeRolePolicy = fs.readFileSync(
          'iam_policies/' + role.assumeRolePolicy,
          'utf-8'
        );

        // Create the IAM role using the loaded assume role policy.
        const iamRole = new IamRole(this, `${config.userId}-${key}`, {
          assumeRolePolicy: assumeRolePolicy,
          name: `${key}`,
        });

        // Create an IAM instance profile for the IAM role.
        new IamInstanceProfile(
          this,
          `${config.userId}-${key}-iam-instance-profile`,
          {
            name: `${key}`,
            role: iamRole.name,
          }
        );

        // Attach custom IAM policies defined in JSON files to the IAM role.
        role.iamPolicyTemplateJson?.forEach(
          (iamPolicyJson: string, index: number) => {
            // Load the IAM policy document from the provided JSON file.
            const iamPolicyDocumentJson = fs.readFileSync(
              'iam_policies/' + iamPolicyJson,
              'utf-8'
            );

            // Create the IAM policy using the loaded IAM policy document.
            const iamPolicy = new IamPolicy(
              this,
              `${config.userId}-${key}-iam-policy${index}`,
              {
                name: `${key}-iam-policy${index}`,
                policy: iamPolicyDocumentJson,
              }
            );

            // Attach the IAM policy to the IAM role.
            new IamPolicyAttachment(
              this,
              `${config.userId}-${key}-iam-policy-attachment-json${index}`,
              {
                policyArn: iamPolicy.arn,
                name: `${key}-iam-policy-attachment-json${index}`,
                roles: [iamRole.id],
              }
            );
          }
        );

        // Attach existing IAM policies by ARN to the IAM role.
        role.policyArn?.forEach((policyArn: string, index: number) => {
          new IamPolicyAttachment(
            this,
            `${config.userId}-${key}-iam-policy-attachment-arn${index}`,
            {
              policyArn: `arn:aws:iam::aws:policy/${policyArn}`,
              name: `${key}-iam-policy-attachment-arn${index}`,
              // Continuing from where we left, attach the IAM role to the policy
              roles: [iamRole.id],
            }
          );
        });
      }
    }
  }
}
