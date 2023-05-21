# mongo_s3_backup.py

import boto3
import os
import subprocess
import datetime

def lambda_handler(event, context):
    try:
        # Define the MongoDB host and S3 bucket from environment variables
        mongo_host = os.environ.get('MONGO_HOST')
        s3_bucket_name = os.environ.get('S3_BUCKET')

        backup_folder = '/tmp/mongodb-backups/'

        # Create the backup folder
        if not os.path.exists(backup_folder):
            os.makedirs(backup_folder)

        # Get the current date for backup file
        current_date = datetime.datetime.now().strftime('%Y-%m-%d')

        # Run mongodump to backup MongoDB to the backup folder
        subprocess.check_output(['mongodump', '--host', mongo_host, '--out', backup_folder + current_date])

        # Create a session using boto3
        session = boto3.Session()

        # Define S3 resource using the session
        s3 = session.resource('s3')

        # Upload each file in the backup directory to S3
        for root, dirs, files in os.walk(backup_folder):
            for file in files:
                s3.meta.client.upload_file(os.path.join(root, file), s3_bucket_name, file)

        return {
            'statusCode': 200,
            'body': 'MongoDB backup taken successfully!'
        }
    except Exception as e:
        return {
            'statusCode': 500,
            'body': 'Error occurred while taking MongoDB backup: ' + str(e)
        }
