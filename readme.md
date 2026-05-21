FE design on stich: https://stitch.withgoogle.com/projects/15788824446682183393

## Backend deployment

The backend runs on an EC2 instance (eu-north-1) behind nginx, with TLS
terminated via nginx + sslip.io. Deploys are automated through the
`Deploy backend to EC2` GitHub Actions workflow on pushes to `main`.

Connection details (host, SSH key, user, app dir) are stored as GitHub
Actions secrets (`EC2_HOST`, `EC2_USER`, `EC2_SSH_KEY`, `EC2_APP_DIR`) and are
intentionally not committed to this public repository.

Note: the instance has no Elastic IP, so the public IP changes on stop/start.
If it changes, update the `EC2_HOST` GitHub secret.
