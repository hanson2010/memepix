#!/bin/bash
# Creates a Cloud Scheduler job to run daily at 3 AM UTC
# Usage: ./setup-scheduler.sh <PROJECT_ID> <SERVICE_URL>

PROJECT_ID="${1:-$(gcloud config get-value project)}"
SERVICE_URL="${2:-}"

if [ -z "$SERVICE_URL" ]; then
  echo "Usage: $0 <PROJECT_ID> <SERVICE_URL>"
  echo "Example: $0 my-project https://memepix-xxxxx-nw.a.run.app"
  exit 1
fi

gcloud scheduler jobs http create cleanup-tags \
  --location=us-west1 \
  --schedule="0 3 * * *" \
  --uri="${SERVICE_URL}/api/jobs/cleanup-tags" \
  --http-method=GET \
  --oidc-service-account-email="memepix-sa@${PROJECT_ID}.iam.gserviceaccount.com" \
  --project="$PROJECT_ID"

echo "Cloud Scheduler job created successfully!"
echo "The job will run daily at 3 AM UTC to clean up tags with count <= 0"
