/**
 * Parses the cloudServiceTree.yaml file and validates it against the cloudServiceTreeSchema.json file.
 * @returns {ICloudServiceTree} The parsed cloud service tree object.
 * @throws {Error} If the cloudServiceTree object is invalid against the schema.
 */
import * as fs from 'fs';
import * as yaml from 'yaml';
import Ajv from 'ajv';
import { ICloudServiceTree } from './CloudServiceTreeInterface';

// Read the 'cloudServiceTree.yaml' file and store its contents as a stringervice_tree.yaml' file and store its contents as a string
const cloudServiceTreeYaml = fs.readFileSync('cloudServiceTree.yaml', 'utf-8');

// Parse the YAML string into a JavaScript object
const cloudServiceTree: ICloudServiceTree = yaml.parse(cloudServiceTreeYaml);

// Read the 'cloud_service_tree_schema.json' file and store its contents as a string
const schemaJson = fs.readFileSync('cloudServiceTreeSchema.json', 'utf-8');

// Parse the JSON string into a JavaScript object
const schema = JSON.parse(schemaJson);

// Create a new instance of Ajv
const ajv = new Ajv();

// Validate the 'cloudServiceTree' object against the 'schema' object
const valid = ajv.validate(schema, cloudServiceTree);

// If the validation failed, log an error message and the details of the validation errors, then exit the program with exit code 1
if (!valid) {
  console.log('The cloudServiceTree object is invalid against the schema');
  if (ajv.errors) {
    ajv.errors.forEach((error) => {
      console.log(`Error: ${error.message}`);
      console.log(`Schema path: ${error.schemaPath}`);
      console.log(`Params: ${JSON.stringify(error.params)}`);
    });
  }
  process.exit(1);
}

export { cloudServiceTree };
