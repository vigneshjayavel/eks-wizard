import { TerraformStack } from 'cdktf';
import * as fs from 'fs';
import { IamPolicy } from '@cdktf/provider-aws/lib/iam-policy';
import { AwsProvider } from '@cdktf/provider-aws/lib/provider';
import { Construct } from 'constructs';
import { IamPolicyAttachment } from '@cdktf/provider-aws/lib/iam-policy-attachment';
import { IamRole } from '@cdktf/provider-aws/lib/iam-role';
import { IIamRole } from './CloudServiceTreeInterface';
import { IamInstanceProfile } from '@cdktf/provider-aws/lib/iam-instance-profile';

interface IamStackConfig {
  iamRole: IIamRole;
  userId: string;
}

export class IamStack extends TerraformStack {
  constructor(scope: Construct, id: string, config: IamStackConfig) {
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
          name: `${key}`,
        });

        new IamInstanceProfile(
          this,
          `${config.userId}-${key}-iam-instance-profile`,
          {
            name: `${key}`,
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
                name: `${key}-iam-policy${index}`,
                policy: iamPolicyDocumentJson,
              }
            );
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

        role.policyArn?.forEach((policyArn: string, index: number) => {
          new IamPolicyAttachment(
            this,
            `${config.userId}-${key}-iam-policy-attachment-arn${index}`,
            {
              policyArn: `arn:aws:iam::aws:policy/${policyArn}`,
              name: `${key}-iam-policy-attachment-arn${index}`,
              roles: [iamRole.id],
            }
          );
        });
      }
    }
  }
}
