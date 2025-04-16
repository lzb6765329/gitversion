# GitVersion GitHub Actions

This repository contains GitHub Actions for setting up and using GitVersion, a tool that determines semantic versioning for your projects based on Git history.

## Actions

- [Setup GitVersion](./setup/README.md): Installs GitVersion tool on the runner
- [Execute GitVersion](./execute/README.md): Executes GitVersion and outputs version details

## Complete Example

Below is a complete example of how to use these actions together in a workflow:

```yaml
name: Build and Version

on:
  push:
    branches: [ main, develop, 'release/**', 'hotfix/**', 'feature/**' ]
  pull_request:
    branches: [ main, develop ]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
    - name: Checkout
      uses: actions/checkout@v3
      with:
        fetch-depth: 0  # Required for GitVersion

    # Make sure git-config is set correctly
    - name: Setup Git
      run: |
        git config --global user.name "GitHub Actions"
        git config --global user.email "github-actions@github.com"

    # Setup .NET SDK
    - name: Setup .NET
      uses: actions/setup-dotnet@v2
      with:
        dotnet-version: '6.0.x'

    # Setup GitVersion
    - name: Setup GitVersion
      uses: your-username/setup-gitversion@v1
      with:
        versionSpec: '5.x'

    # Ensure master branch exists for GitVersion
    - name: Create local master branch if needed
      run: |
        git fetch origin +refs/heads/main:refs/heads/main || true
        git branch --list main || git branch main origin/main || git branch main || true

    # Execute GitVersion
    - name: Execute GitVersion
      id: gitversion
      uses: your-username/execute-gitversion@v1
      with:
        useConfigFile: true
        configFilePath: GitVersion.yml

    # Display GitVersion outputs
    - name: Display GitVersion outputs
      run: |
        echo "Major: ${{ steps.gitversion.outputs.major }}"
        echo "Minor: ${{ steps.gitversion.outputs.minor }}"
        echo "Patch: ${{ steps.gitversion.outputs.patch }}"
        echo "SemVer: ${{ steps.gitversion.outputs.semVer }}"
        echo "FullSemVer: ${{ steps.gitversion.outputs.fullSemVer }}"
        echo "NuGetVersion: ${{ steps.gitversion.outputs.nuGetVersion }}"

    # Your build steps here
    - name: Build project
      run: |
        dotnet build --configuration Release /p:Version=${{ steps.gitversion.outputs.fullSemVer }}

    # Example of artifact versioning
    - name: Package project
      run: |
        dotnet pack --configuration Release /p:Version=${{ steps.gitversion.outputs.fullSemVer }} --output .

    # Example of uploading versioned artifacts
    - name: Upload artifacts
      uses: actions/upload-artifact@v3
      with:
        name: packages-${{ steps.gitversion.outputs.fullSemVer }}
        path: ./**/*.nupkg
```

## Sample GitVersion.yml

Here's a sample GitVersion.yml configuration file:

```yaml
mode: Mainline
branches:
  main:
    regex: ^master$|^main$
    tag: ''
    increment: Patch
    prevent-increment-of-merged-branch-version: true
    track-merge-target: false
    tracks-release-branches: false
    is-release-branch: true
  release:
    regex: ^releases?[/-]
    tag: beta
    increment: Patch
    prevent-increment-of-merged-branch-version: true
    track-merge-target: false
    tracks-release-branches: false
    is-release-branch: true
  feature:
    regex: ^features?[/-]
    tag: alpha.{BranchName}
    increment: Inherit
    prevent-increment-of-merged-branch-version: false
    track-merge-target: false
    tracks-release-branches: false
    is-release-branch: false
  hotfix:
    regex: ^hotfix(es)?[/-]
    tag: beta
    increment: Patch
    prevent-increment-of-merged-branch-version: false
    track-merge-target: false
    tracks-release-branches: false
    is-release-branch: false
  develop:
    regex: ^dev(elop)?(ment)?$
    tag: alpha
    increment: Minor
    prevent-increment-of-merged-branch-version: false
    track-merge-target: true
    tracks-release-branches: true
    is-release-branch: false
ignore:
  sha: []
merge-message-formats: {}
```

## Requirements

- Both actions require the .NET SDK to be installed.
- Your repository needs to be fully cloned (use `fetch-depth: 0` in the checkout action).
- GitVersion works best with well-structured Git branches. Consider using GitFlow or a similar branching strategy.

## License

MIT 