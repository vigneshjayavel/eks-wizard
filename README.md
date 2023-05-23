# Enhanced Cloud Management with CloudServiceTree

CloudServiceTree represents a paradigm shift in cloud infrastructure management, emphasizing a no-code approach and robust modularity. This framework has been used to build an advanced three-tier web application on Amazon Web Services (AWS) as part of the Wiz SE Technical Exercise.

## In-Depth Overview of the Framework and Deployment

CloudServiceTree abstracts complex infrastructure code, enabling you to define your cloud environment via simple YAML configuration files. The configuration file in this exercise sets up a rich three-tier web application in AWS, which includes various AWS services like IAM, S3, VPC, EKS, and EC2, along with the deployment of MongoDB on an EC2 instance.

![outposts_services](documentation/Eks-app.png)


## CloudServiceTree configuration breackdown:

This YAML configuration file describes the deployment of a cloud environment on AWS, specifying all the components and their settings. Let's break it down:


```
iamRole:
  mongoDbInstanceRole:
    - assumeRolePolicy: instance_assume_role_policy.json
      iamPolicyTemplateJson:
        - ec2_all.json        
userId: fdervisi
regions: 
  - name: eu-south-1
    lamdaS3Bucket: fdervisi-repro-bucket
    s3:
      bucketName: fdervisi-mongodb-backup
      blockPublicAccess: false
    vpc:
      - cidrBlock: 10.0.0.0/20
        name: vpc-eks-app
        privateHostedZone: fdervisi.io
        eks:
          clusterName: eks-cluster
          version: "1.26"
          KubernetesApplication: false
          nodeGroup:
            instanceTypes: t3.small
            scalingConfig:
              desiredSize: 3
              maxSize: 5
              minSize: 1
        subnets:
          - name: subnet-eks-private1
            public: false
            cidrBlock: 10.0.1.0/24  
            availabilityZone: 0
            eks: true
          - name: subnet-eks-private2
            public: false
            cidrBlock: 10.0.2.0/24
            availabilityZone: 1
            eks: true
          - name: subnet-eks-private3
            public: false
            cidrBlock: 10.0.3.0/24
            availabilityZone: 2
            eks: true
          - name: subnet-mongoDB
            public: true
            cidrBlock: 10.0.4.0/24
            availabilityZone: 0
            eks: false
            instance:
              - name: instance-mongoDb
                instanceType: t3.micro
                ami: ami-0a3a6d4d737db3bc1
                associatePublicIpAddress: true
                eip: true
                privatDnsHostName: mongodb
                iamInstanceProfile: mongoDbInstanceRole
                userData: userdata.sh
                keyName: Key_MBP_fdervisi
                securityGroup:
                  ingress:
                    - cidrBlocks:
                        - 0.0.0.0/0
                      fromPort: 22
                      toPort: 22
                      protocol: "TCP"
                    - cidrBlocks:
                        - 0.0.0.0/0
                      fromPort: 27017
                      toPort: 27017
                      protocol: "TCP"
                  egress:
                    - cidrBlocks:
                        - 0.0.0.0/0
                      fromPort: 0
                      toPort: 0
                      protocol: "-1"
                  tags:
                    Owner: fdervisi
            
```

1. **IAM Role**: The `iamRole` field specifies the AWS Identity and Access Management (IAM) role for this deployment, named `mongoDbInstanceRole`. The `assumeRolePolicy` and `iamPolicyTemplateJson` subfields refer to JSON policy files (`instance_assume_role_policy.json` and `ec2_all.json` respectively) which define what services and actions the role can assume and perform. This role will be associated with the MongoDB EC2 instance, allowing it to perform necessary operations.

2. **User ID**: The `userId` field indicates the user or account that this configuration is associated with. In this case, the user is `fdervisi`.

3. **Regions**: This section contains the configuration for the AWS region `eu-south-1`. 

   - `lamdaS3Bucket`: It specifies the S3 bucket `fdervisi-repro-bucket` to be used for AWS Lambda function storage.
   
   - `s3`: This defines another S3 bucket, `fdervisi-mongodb-backup`, to store MongoDB backups. `blockPublicAccess` is set to `false`, making the bucket publicly readable.
   
4. **VPC**: The `vpc` field describes the virtual private cloud (VPC) settings. A VPC named `vpc-eks-app` is created with a CIDR block of `10.0.0.0/20`. It has a private DNS zone (`fdervisi.io`).

   - **EKS**: Within the VPC, an Amazon Elastic Kubernetes Service (EKS) cluster named `eks-cluster` is set up. It uses version "1.26" of EKS. A node group is configured to use `t3.small` instances, with a scaling configuration of 1-5 instances, desiring 3 instances at a time.
   
   - **Subnets**: Four subnets are defined within the VPC. Three private subnets are dedicated for the EKS cluster (`subnet-eks-private1`, `subnet-eks-private2`, `subnet-eks-private3`). A public subnet, `subnet-mongoDB`, is set up for the MongoDB instance. 

5. **MongoDB Instance**: An EC2 instance is created in the public subnet for MongoDB. This instance is of type `t3.micro`, uses the specified Amazon Machine Image (AMI), and is associated with the previously defined IAM role `mongoDbInstanceRole`. The instance is publicly accessible and has an Elastic IP (EIP). User data (`userdata.sh`) and a key pair (`Key_MBP_fdervisi`) are also defined for this instance.

   - **Security Group**: The security group associated with the instance specifies the rules for inbound (`ingress`) and outbound (`egress`) traffic. Ingress rules allow SSH (port 22) and MongoDB (port 27017) connections from any IP address (`0.0.0.0/0`). The egress rule allows all outbound traffic. A tag of `Owner: fdervisi` is added to the security group.

This configuration enables the deployment of a containerized web application in an EKS cluster, supported by a MongoDB database on an EC2 instance, all within a well-defined VPC. The use of modular definitions simplifies cloud management, allowing easy adjustment of individual components and facilitating the scaling of the deployment across regions. This also makes it a suitable backend for a GUI, which can simplify user interaction with the infrastructure management.


### Extensibility & Modularity

The modular design of CloudServiceTree makes it easy to manage individual services without needing to understand the entire infrastructure. This modular setup also aids in maintaining the codebase as services can be independently updated, scaled, or modified without disrupting the whole infrastructure. 

Each YAML configuration file is an independent module, contributing to a particular aspect of the infrastructure, whether it be setting up an IAM role, defining a VPC, or deploying an EKS cluster. For instance, if you need to scale your deployment across multiple regions, you can simply replicate the desired modules in your new region-specific configuration file. This extensibility enables your infrastructure to grow with your needs without demanding additional scripting or manual work.

### Backend for GUI

CloudServiceTree's approach makes it a suitable backend for a graphical user interface (GUI). By simply interacting with the GUI, users can modify the YAML configuration files to alter the infrastructure without needing to write or understand code. This not only brings convenience to the users but also enhances efficiency, particularly when scaling or adjusting the cloud environment to meet evolving requirements.

## Value Proposition Over Traditional Terraform Deployment

Compared to traditional infrastructure management using Terraform, CloudServiceTree offers several distinct advantages:

1. **No-Code Deployment**: While Terraform requires understanding and writing of HashiCorp Language (HCL), CloudServiceTree abstracts away the coding aspect. The YAML configuration files are human-readable and easy to manage without in-depth coding knowledge.

2. **Modular Architecture**: Although Terraform supports modularity, the real benefit of CloudServiceTree is its high-level, service-based modularity. This results in less code, clearer structure, and easier maintainability.

3. **Streamlined Management**: Terraform requires separate state management and potential complexities arising from state file discrepancies. CloudServiceTree, in contrast, reduces the management overhead by handling state internally and transparently.

4. **Scalability**: With CloudServiceTree, scaling across multiple regions or adding new services is as simple as adding or duplicating configuration modules. In contrast, Terraform would require you to write additional code.

5. **Integration with GUI**: Due to its no-code approach and clear structure, CloudServiceTree is well-suited to integration with a GUI for infrastructure management. This is not as straightforward with Terraform.

In conclusion, CloudServiceTree provides an accessible, scalable, and efficient way to manage cloud infrastructure. This exercise showcases the deployment of a complex three-tier web application using this advanced framework, underscoring the value and power of this next-generation approach to cloud management.