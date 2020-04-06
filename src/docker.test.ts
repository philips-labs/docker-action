import { docker } from './docker';
import { exec } from '@actions/exec';
import { setOutput } from '@actions/core';

jest.mock('@actions/exec');
jest.mock('@actions/core', () => ({
  ...jest.requireActual('@actions/core'),
  setOutput: jest.fn(),
}));

describe('Docker action', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    process.env['INPUT_IMAGENAME'] = 'HelloWorld';
    process.env['INPUT_WORKINGDIRECTORY'] = 'src';
    process.env['INPUT_DOCKERREGISTRY'] = 'test-registry.io';
    process.env['INPUT_DOCKERFILE'] = 'Dockerfile';
    process.env['INPUT_LATESTBRANCH'] = 'master';
    process.env['GITHUB_REF'] = 'refs/heads/develop';
  });

  it.each`
    option                      | value
    ${'INPUT_IMAGENAME'}        | ${'imageName'}
    ${'INPUT_WORKINGDIRECTORY'} | ${'workingDirectory'}
    ${'INPUT_DOCKERREGISTRY'}   | ${'dockerRegistry'}
    ${'INPUT_DOCKERFILE'}       | ${'dockerfile'}
    ${'INPUT_LATESTBRANCH'}     | ${'latestBranch'}
  `(
    `should throw an error when the option $value is missing`,
    async ({ option, value }) => {
      expect.assertions(1);
      delete process.env[option];

      try {
        await docker();
      } catch (e) {
        await expect(e.message).toContain(`not supplied: ${value}`);
      }
    },
  );

  it('should set the tag as output', async () => {
    const mockedExec = exec as jest.Mock<Promise<number>>;
    mockedExec.mockReturnValue(Promise.resolve(0));

    await docker();

    await expect(setOutput).toHaveBeenCalledWith('dockerTag', 'develop');
  });

  it('should determine the tag from branch name', async () => {
    process.env['GITHUB_REF'] = 'refs/heads/feature/a-feature-branch';
    const mockedExec = exec as jest.Mock<Promise<number>>;
    mockedExec.mockReturnValue(Promise.resolve(0));

    await docker();

    await expect(setOutput).toHaveBeenCalledWith(
      'dockerTag',
      'a-feature-branch',
    );
  });

  it('should determine the tag from tag name', async () => {
    process.env['GITHUB_REF'] = 'refs/tags/2.0.0';
    const mockedExec = exec as jest.Mock<Promise<number>>;
    mockedExec.mockReturnValue(Promise.resolve(0));

    await docker();

    await expect(setOutput).toHaveBeenCalledWith('dockerTag', '2.0.0');
  });

  it('should set tag name to latest if branch is latest branch', async () => {
    process.env['GITHUB_REF'] = 'refs/heads/master';
    const mockedExec = exec as jest.Mock<Promise<number>>;
    mockedExec.mockReturnValue(Promise.resolve(0));

    await docker();

    await expect(setOutput).toHaveBeenCalledWith('dockerTag', 'latest');
  });

  it('should build the docker image', async () => {
    const mockedExec = exec as jest.Mock<Promise<number>>;
    mockedExec.mockReturnValue(Promise.resolve(0));

    await docker();

    await expect(exec).toHaveBeenCalledWith(
      'docker',
      ['build', `-f Dockerfile`, `-t test-registry.io/HelloWorld:develop`, `.`],
      {
        cwd: 'src',
      },
    );
  });

  it('throws an error when building the docker image fails', async () => {
    const mockedExec = exec as jest.Mock<Promise<number>>;
    mockedExec.mockReturnValue(Promise.resolve(1));

    await expect(docker()).rejects.toThrowError();
  });

  it('should push the docker image', async () => {
    const mockedExec = exec as jest.Mock<Promise<number>>;
    mockedExec.mockReturnValue(Promise.resolve(0));

    await docker();

    await expect(exec).toHaveBeenCalledWith('docker', [
      'push',
      `test-registry.io/HelloWorld:develop`,
    ]);
  });

  it('throws an error when pushing the docker image fails', async () => {
    const mockedExec = exec as jest.Mock<Promise<number>>;
    mockedExec
      .mockReturnValueOnce(Promise.resolve(0))
      .mockReturnValueOnce(Promise.resolve(1));

    await expect(docker()).rejects.toThrowError();
  });
});
