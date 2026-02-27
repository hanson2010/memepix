variable "project_id" {
  type        = string
  description = "GCP Project ID"
}

resource "google_cloud_scheduler_job" "cleanup_tags" {
  name        = "cleanup-tags"
  description = "Daily job to remove tags with count <= 0"
  schedule    = "0 3 * * *"  # Run daily at 3 AM UTC
  time_zone   = "UTC"
  region      = "us-west1"

  http_target {
    http_method = "GET"
    uri         = "https://memepix-XXXXX-nw.a.run.app/api/jobs/cleanup-tags"
    oidc_token {
      service_account_email = "memepix-sa@${var.project_id}.iam.gserviceaccount.com"
    }
  }
}
