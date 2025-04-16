# Setup GitVersion

This GitHub Action installs GitVersion tool on the runner.

## Inputs

| Name | Description | Required | Default |
| ---- | ----------- | -------- | ------- |
| `versionSpec` | Version of GitVersion to install. Examples: 5.x, 5.11.x, 5.11.0 | false | '5.x' |
| `includePrerelease` | Include pre-release versions when matching a version | false | 'false' |

## Usage

```yaml
steps:
- name: Checkout repository
  uses: actions/checkout@v3
  with:
    fetch-depth: 0  # Required for GitVersion

- name: Setup .NET
  uses: actions/setup-dotnet@v2
  with:
    dotnet-version: '6.0.x'

- name: Setup GitVersion
  uses: your-username/setup-gitversion@v1
  with:
    versionSpec: '5.x'
    includePrerelease: 'false'
```

## Requirements

- GitVersion requires the .NET SDK to be installed. Make sure to add the `actions/setup-dotnet` step before using this action.
- When checking out your repository, make sure to set `fetch-depth: 0` to fetch the full history, which is required for GitVersion to work correctly.

## Notes

- This action installs GitVersion.Tool from NuGet as a .NET global tool.
- The tool is installed as `dotnet-gitversion` and will be available in the PATH.
- After running this action, you can execute GitVersion using the `dotnet-gitversion` command. 