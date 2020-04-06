# Docker Action

A Github action for building and pushing docker images.

## Inputs

| Input            | Description                                                                |
| ---------------- | :------------------------------------------------------------------------- |
| imageName        | The name of the docker image                                               |
| workingDirectory | The working directory from which to run the docker commands (default: `.`) |
| dockerRegistry   | The registry to push the image name (default: `docker.io`)                 |
| dockerfile       | Path to Dockerfile (default: `Dockerfile`)                                 |
| latestBranch     | From which branch to create latest releases (default: `master`)            |

## Outputs

| Output    | Description                       |
| --------- | :-------------------------------- |
| dockerTag | The docker tag of the built image |

## Sample Configuration

Note: This function only builds and pushes docker images. Logging in should be used with other actions.

### Docker hub

```yml
docker:
  name: Publish Docker Image
  runs-on: self-hosted
  steps:
    - run: docker login -u ${{ secrets.DOCKER_USERNAME }} -p ${{ secrets. DOCKER_PASSWORD }}

    - uses: philips-labs/docker-action@master
      with:
        imageName: hello-world
```

### Custom Docker Registry

```yml
docker:
  name: Publish Docker Image
  runs-on: self-hosted
  steps:
    - uses: actions/checkout@v2

    - run: docker login my-docker-registry.io -u ${{ secrets.DOCKER_USERNAME }} -p ${{ secrets. DOCKER_PASSWORD }}

    - uses: philips-labs/docker-action@master
      with:
        imageName: hello-world
        dockerRegistry: my-docker-registry.io
```

### AWS Elastic Container Registry

```yml
docker:
  name: Publish Docker Image
  runs-on: self-hosted
  steps:
    - uses: actions/checkout@v2

    - name: Configure AWS Credentials
      uses: aws-actions/configure-aws-credentials@v1
      with:
        aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
        aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
        aws-region: eu-west-1

    - name: Login to Amazon ECR
      id: login_ecr
      uses: aws-actions/amazon-ecr-login@v1

    - uses: philips-labs/docker-action@master
      with:
        imageName: hello-world
        dockerRegistry: ${{ steps.login_ecr.outputs.registry }}

    - name: Logout of Amazon ECR
        if: always()
        run: docker logout ${{ steps.login-ecr.outputs.registry }}
```
