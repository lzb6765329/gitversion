const core = require('@actions/core');
const exec = require('@actions/exec');
const path = require('path');
const fs = require('fs');

async function run() {
  try {
    // Get inputs
    const targetPath = core.getInput('targetPath');
    const useConfigFile = core.getBooleanInput('useConfigFile');
    const configFilePath = core.getInput('configFilePath');
    const updateAssemblyInfo = core.getBooleanInput('updateAssemblyInfo');
    const additionalArguments = core.getInput('additionalArguments');

    // Validate target path
    const resolvedTargetPath = path.resolve(targetPath);
    if (!fs.existsSync(resolvedTargetPath)) {
      throw new Error(`Target path does not exist: ${resolvedTargetPath}`);
    }

    // Validate config file path if specified
    if (useConfigFile) {
      const resolvedConfigPath = path.resolve(configFilePath);
      if (!fs.existsSync(resolvedConfigPath)) {
        throw new Error(`Config file does not exist: ${resolvedConfigPath}`);
      }
    }

    // Build command arguments
    const args = buildCommandArguments(resolvedTargetPath, useConfigFile, configFilePath, updateAssemblyInfo, additionalArguments);

    // Execute GitVersion
    console.log(`Executing GitVersion with: dotnet-gitversion ${args.join(' ')}`);
    let output = '';
    
    const options = {
      cwd: resolvedTargetPath,
      listeners: {
        stdout: (data) => {
          output += data.toString();
        }
      }
    };

    await exec.exec('dotnet-gitversion', args, options);
    
    // Parse the output as JSON
    const gitVersionOutput = JSON.parse(output);
    
    // Set outputs for all GitVersion values
    setGitVersionOutputs(gitVersionOutput);
    
    console.log('GitVersion executed successfully.');
  } catch (error) {
    core.setFailed(`GitVersion execution failed: ${error.message}`);
  }
}

function buildCommandArguments(targetPath, useConfigFile, configFilePath, updateAssemblyInfo, additionalArguments) {
  const args = [];
  
  // Always output JSON
  args.push('/output', 'json');
  
  // Update assembly info if requested
  if (updateAssemblyInfo) {
    args.push('/updateassemblyinfo');
  }
  
  // Use config file if requested
  if (useConfigFile) {
    args.push('/config', configFilePath);
  }
  
  // Add additional arguments if provided
  if (additionalArguments) {
    // Split by space, but respect quoted strings
    const additionalArgs = additionalArguments.match(/(?:[^\s"]+|"[^"]*")+/g);
    if (additionalArgs) {
      args.push(...additionalArgs);
    }
  }
  
  return args;
}

function setGitVersionOutputs(gitVersionOutput) {
  // Output all GitVersion variables
  core.setOutput('major', gitVersionOutput.Major);
  core.setOutput('minor', gitVersionOutput.Minor);
  core.setOutput('patch', gitVersionOutput.Patch);
  core.setOutput('preReleaseTag', gitVersionOutput.PreReleaseTag);
  core.setOutput('preReleaseTagWithDash', gitVersionOutput.PreReleaseTagWithDash);
  core.setOutput('preReleaseLabel', gitVersionOutput.PreReleaseLabel);
  core.setOutput('preReleaseNumber', gitVersionOutput.PreReleaseNumber);
  core.setOutput('weightedPreReleaseNumber', gitVersionOutput.WeightedPreReleaseNumber);
  core.setOutput('buildMetaData', gitVersionOutput.BuildMetaData);
  core.setOutput('buildMetaDataPadded', gitVersionOutput.BuildMetaDataPadded);
  core.setOutput('fullBuildMetaData', gitVersionOutput.FullBuildMetaData);
  core.setOutput('majorMinorPatch', gitVersionOutput.MajorMinorPatch);
  core.setOutput('semVer', gitVersionOutput.SemVer);
  core.setOutput('legacySemVer', gitVersionOutput.LegacySemVer);
  core.setOutput('legacySemVerPadded', gitVersionOutput.LegacySemVerPadded);
  core.setOutput('assemblySemVer', gitVersionOutput.AssemblySemVer);
  core.setOutput('assemblySemFileVer', gitVersionOutput.AssemblySemFileVer);
  core.setOutput('fullSemVer', gitVersionOutput.FullSemVer);
  core.setOutput('informationalVersion', gitVersionOutput.InformationalVersion);
  core.setOutput('branchName', gitVersionOutput.BranchName);
  core.setOutput('sha', gitVersionOutput.Sha);
  core.setOutput('shortSha', gitVersionOutput.ShortSha);
  core.setOutput('nuGetVersion', gitVersionOutput.NuGetVersion);
  core.setOutput('nuGetVersionV2', gitVersionOutput.NuGetVersionV2);
  core.setOutput('nuGetPreReleaseTag', gitVersionOutput.NuGetPreReleaseTag);
  core.setOutput('nuGetPreReleaseTagV2', gitVersionOutput.NuGetPreReleaseTagV2);
  core.setOutput('versionSourceSha', gitVersionOutput.VersionSourceSha);
  core.setOutput('commitsSinceVersionSource', gitVersionOutput.CommitsSinceVersionSource);
  core.setOutput('commitsSinceVersionSourcePadded', gitVersionOutput.CommitsSinceVersionSourcePadded);
  core.setOutput('commitDate', gitVersionOutput.CommitDate);

  // Log the most common values
  console.log(`SemVer: ${gitVersionOutput.SemVer}`);
  console.log(`FullSemVer: ${gitVersionOutput.FullSemVer}`);
  console.log(`MajorMinorPatch: ${gitVersionOutput.MajorMinorPatch}`);
  console.log(`NuGetVersion: ${gitVersionOutput.NuGetVersion}`);
}

run(); 