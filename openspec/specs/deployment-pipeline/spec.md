## Purpose

Automated CI/CD pipeline from GitHub to Google Cloud Run.

## Requirements

### Requirement: System builds automatically on GitHub push
The system SHALL trigger a Cloud Build when code is pushed to the main branch.

#### Scenario: Push to main branch
- **WHEN** code is pushed to the main branch on GitHub
- **THEN** Cloud Build automatically starts a new build

#### Scenario: Build configuration found
- **WHEN** Cloud Build triggers
- **THEN** system uses the cloudbuild.yaml configuration in the repository

### Requirement: System deploys to Cloud Run
The system SHALL deploy the built container to Google Cloud Run automatically after successful build.

#### Scenario: Successful build
- **WHEN** Cloud Build completes successfully
- **THEN** system deploys the new container to Cloud Run

#### Scenario: Deployment health check
- **WHEN** new deployment is live
- **THEN** system routes traffic to the new revision

### Requirement: System handles build failures
The system SHALL notify on build failures and not deploy broken code.

#### Scenario: Build fails
- **WHEN** build step fails in Cloud Build
- **THEN** system does not deploy and logs the error

#### Scenario: Test failure
- **WHEN** tests fail during build
- **THEN** build is marked as failed and no deployment occurs

### Requirement: System uses environment variables for configuration
The system SHALL use environment variables for sensitive configuration (API keys, credentials).

#### Scenario: Environment variables set
- **WHEN** Cloud Run service is configured
- **THEN** environment variables for Gemini API key, R2 credentials are available to the application

#### Scenario: Secrets management
- **WHEN** deploying
- **THEN** secrets are retrieved from Google Secret Manager, not stored in code

### Requirement: System supports rollback
The system SHALL allow rolling back to a previous deployment revision.

#### Scenario: Rollback to previous revision
- **WHEN** a deployment has issues
- **THEN** administrator can redirect traffic to a previous revision via Cloud Run console

#### Scenario: View revision history
- **WHEN** administrator views Cloud Run service
- **THEN** all previous revisions are visible with timestamps
