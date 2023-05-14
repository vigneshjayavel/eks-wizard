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


