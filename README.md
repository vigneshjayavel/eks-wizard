# AWS EKS Infrastructure Deployment with CDKTF

This repository contains a TypeScript application that uses the [Cloud Development Kit for Terraform (CDKTF)](https://learn.hashicorp.com/tutorials/terraform/cdktf) to provision an Amazon Elastic Kubernetes Service (EKS) cluster along with its required infrastructure on AWS.

## Overview

This application creates an EKS cluster along with the necessary supporting AWS resources, including:

- A VPC with subnets in three different availability zones.
- An Internet Gateway and a NAT Gateway for internet connectivity.
- A route table and associations for managing traffic between the subnets and the gateways.
- A MongoDB instance running on an EC2 instance.
- An EIP (Elastic IP) associated with the MongoDB instance and a Route53 private hosted zone for DNS.
- IAM roles and policies for the EKS cluster and worker nodes.
- An EKS node group which contains worker nodes running on EC2 instances.

The EKS cluster is made up of a control plane (managed by AWS) and worker nodes (EC2 instances in your AWS account).

## KubernetesApplicationStack

The `KubernetesApplicationStack` class is used to deploy a Kubernetes application to the EKS cluster created earlier. It sets up the following resources:

- A Kubernetes provider configured with the EKS cluster endpoint, CA certificate, and authentication token.
- A secret for the MongoDB connection string, which is stored in the Kubernetes cluster as a secret resource.
- A deployment for the backend application with one replica, using a container image from a Docker registry, and environment variables for the MongoDB connection string.
- A service for the backend application, exposing it on port 3000.
- A deployment for the frontend application with one replica, using a container image from a Docker registry.
- A service for the frontend application, exposing it as a LoadBalancer service on port 3000.

The `KubernetesApplicationStack` class is then instantiated with the `EksStack` instance and the application is synthesized to generate the Terraform configuration files.

## Usage

To deploy the EKS infrastructure and the Kubernetes application, follow these steps:

1. Install the CDKTF CLI and other dependencies.
2. Run `cdktf get` to download the necessary provider modules.
3. Run `cdktf deploy` to deploy the infrastructure to your AWS account.
4. Use the `kubectl` CLI to interact with your EKS cluster and verify that the application is running correctly.

---

This updated `README.md` now provides an explanation of the `KubernetesApplicationStack` class and the resources it creates within the EKS cluster.



## Install Terraform

wget -O- https://apt.releases.hashicorp.com/gpg | sudo gpg --dearmor -o /usr/share/keyrings/hashicorp-archive-keyring.gpg
echo "deb [signed-by=/usr/share/keyrings/hashicorp-archive-keyring.gpg] https://apt.releases.hashicorp.com $(lsb_release -cs) main" | sudo tee /etc/apt/sources.list.d/hashicorp.list
sudo apt update && sudo apt install terraform


## Create and initialize the project 
https://developer.hashicorp.com/terraform/tutorials/cdktf/cdktf-install

npm install --global cdktf-cli@latest
mkdir eks-app
cdktf init --template=typescript

## Download AWS provider


## install Modules

in ```cdktf.json``` add **terraformModules**
{
  "language": "typescript",
  "app": "npx ts-node main.ts",
  "projectId": "36c31cb2-be41-4217-890f-02eea2057b10",
  "sendCrashReports": "false",
  "terraformProviders": [],
  "terraformModules": [
   "terraform-aws-modules/vpc/aws@ ~> 4.0",
    "terraform-aws-modules/eks/aws@ ~> 19.13""
  ],
  "context": {
    "excludeStackIdFromLogicalIds": "true",
    "allowSepCharsInLogicalIds": "true"
  }
}


