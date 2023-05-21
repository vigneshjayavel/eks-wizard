import { TerraformStack } from 'cdktf';
import * as fs from 'fs';
import { IamPolicy } from '@cdktf/provider-aws/lib/iam-policy';
import { AwsProvider } from '@cdktf/provider-aws/lib/provider';
import { Construct } from 'constructs';
import { IamPolicyAttachment } from '@cdktf/provider-aws/lib/iam-policy-attachment';
import { IamRole } from '@cdktf/provider-aws/lib/iam-role';
import { IIamRole } from './CloudServiceTreeInterface';
import { IamInstanceProfile } from '@cdktf/provider-aws/lib/iam-instance-profile';

interface AwsIamStackConfig {
  iamRole: IIamRole;
  userId: string;
}

export class AwsIamStack extends TerraformStack {
  constructor(scope: Construct, id: string, config: AwsIamStackConfig) {
    super(scope, id);
    new AwsProvider(this, 'AWS', { region: 'us-east-1' });

    for (const key of Object.keys(config.iamRole)) {
      for (const role of Object.values(config.iamRole[key])) {
        const assumeRolePolicy = fs.readFileSync(
          'iam_policies/' + role.assumeRolePolicy,
          'utf-8'
        );
        const iamRole = new IamRole(this, `${config.userId}-${key}`, {
          assumeRolePolicy: assumeRolePolicy,
          name: `${config.userId}-${key}`,
        });

        new IamInstanceProfile(
          this,
          `${config.userId}-${key}-iam-instance-profile`,
          {
            name: `${config.userId}-${key}`,
            role: iamRole.name,
          }
        );
        role.iamPolicyTemplateJson?.forEach(
          (iamPolicyJson: string, index: number) => {
            const iamPolicyDocumentJson = fs.readFileSync(
              'iam_policies/' + iamPolicyJson,
              'utf-8'
            );

            const iamPolicy = new IamPolicy(
              this,
              `${config.userId}-${key}-iam-policy${index}`,
              {
                name: `${config.userId}-${key}-iam-policy${index}`,
                policy: iamPolicyDocumentJson,
              }
            );
            new IamPolicyAttachment(
              this,
              `${config.userId}-${key}-iam-policy-attachment-json${index}`,
              {
                policyArn: iamPolicy.arn,
                name: `${config.userId}-${key}-iam-policy-attachment-json${index}`,
                roles: [iamRole.id],
              }
            );
          }
        );

        role.policyArn?.forEach((policyArn: string, index: number) => {
          new IamPolicyAttachment(
            this,
            `${config.userId}-${key}-iam-policy-attachment-arn${index}`,
            {
              policyArn: `arn:aws:iam::aws:policy/${policyArn}`,
              name: `${config.userId}-${key}-iam-policy-attachment-arn${index}`,
              roles: [iamRole.id],
            }
          );
        });
      }
    }
  }
}
