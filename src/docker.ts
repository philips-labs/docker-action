import * as core from '@actions/core';
import { exec } from '@actions/exec';

async function runInGroup(name: string, fun: () => Promise<void>) {
  core.startGroup(name);
  try {
    await fun();
  } catch (error) {
    core.setFailed(error.message);
    throw error;
  } finally {
    core.endGroup();
  }
}

function getDockerTag(githubRef: string, latestBranch?: string): string {
  const githubRefParts = githubRef.split('/');
  const branchOrTagName = githubRefParts[githubRefParts.length - 1];
  const latestBranches = latestBranch ? [latestBranch] : ['main', 'master'];
  if (githubRefParts[1] === 'heads' && latestBranches.includes(branchOrTagName))
    return 'latest';
  return branchOrTagName;
}

export const docker = async () => {
  const imageName = core.getInput('imageName', { required: true });
  const workingDirectory = core.getInput('workingDirectory', {
    required: true,
  });
  const dockerRegistry = core.getInput('dockerRegistry', { required: true });
  const dockerfile = core.getInput('dockerfile', { required: true });
  const latestBranch = core.getInput('latestBranch');
  const currentBranch = core.getInput('currentBranch');
  const buildArgs: string[] = core
    .getInput('buildArgs')
    .split('\n')
    .filter((x) => x !== '');

  const dockerTag = getDockerTag(
    currentBranch !== '' ? currentBranch : process.env['GITHUB_REF']!,
    latestBranch !== '' ? latestBranch : undefined,
  );
  core.setOutput('dockerTag', dockerTag);

  core.info(`
        Using parameters:
        ImageName       : ${imageName}
        DockerRegistry  : ${dockerRegistry}
        Dockerfile      : ${dockerfile}
        WorkingDirectory: ${workingDirectory}
        LatestBranch    : ${latestBranch}
        DockerTag       : ${dockerTag}
        BuildArgs       : ${buildArgs.join(' ')}
    `);

  await runInGroup('Building image', async () => {
    const buildErrorCode = await exec(
      `docker build ${buildArgs
        .map((a) => '--build-arg ' + a + ' ')
        .join(
          '',
        )}-f ${dockerfile} -t ${dockerRegistry}/${imageName}:${dockerTag} .`,
      [],
      {
        cwd: workingDirectory,
      },
    );
    if (buildErrorCode !== 0) {
      throw Error('Building Docker image failed.');
    }
  });

  await runInGroup('Pushing image', async () => {
    const pushErrorCode = await exec(
      `docker push ${dockerRegistry}/${imageName}:${dockerTag}`,
    );
    if (pushErrorCode !== 0) {
      throw Error('Pushing Docker image failed.');
    }
  });
};
