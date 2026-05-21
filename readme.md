FE design on stich: https://stitch.withgoogle.com/projects/15788824446682183393

## EC2 backend (eu-north-1)

- public-ip: 13.61.233.84
- private dns: ip-172-31-44-178.eu-north-1.compute.internal
- ssh: `ssh -i zerohunger-ssh.pem ec2-user@13.61.233.84`
- api base (TLS via nginx + sslip.io): https://13.61.233.84.sslip.io/api
- health: https://13.61.233.84.sslip.io/api/health

Note: the instance has no Elastic IP, so the public IP changes on stop/start.
If it changes, update this file and the `EC2_HOST` GitHub secret.
