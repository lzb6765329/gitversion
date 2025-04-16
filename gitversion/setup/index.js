const core = require('@actions/core');
const tc = require('@actions/tool-cache');
const exec = require('@actions/exec');
const path = require('path');
const fs = require('fs');
const https = require('https');
const { HttpClient } = require('@actions/http-client');

async function run() {
  try {
    // Get inputs
    const versionSpec = core.getInput('versionSpec');
    const includePrerelease = core.getBooleanInput('includePrerelease');

    console.log(`Installing GitVersion version: ${versionSpec}`);
    console.log(`Include prerelease versions: ${includePrerelease}`);

    // Check if dotnet CLI is installed
    await checkDotnetCli();

    // Install GitVersion
    await installGitVersion(versionSpec, includePrerelease);

    console.log('GitVersion installation completed successfully.');
  } catch (error) {
    core.setFailed(`GitVersion installation failed: ${error.message}`);
  }
}

async function checkDotnetCli() {
  try {
    await exec.exec('dotnet', ['--version']);
  } catch (error) {
    throw new Error('dotnet CLI is required but not found. Please make sure .NET SDK is installed.');
  }
}

async function getNuGetPackageVersions(packageName) {
  const httpClient = new HttpClient('setup-gitversion-action');
  const url = `https://api.nuget.org/v3-flatcontainer/${packageName.toLowerCase()}/index.json`;
  
  const response = await httpClient.get(url);
  const body = await response.readBody();
  return JSON.parse(body).versions;
}

async function findVersion(versions, versionSpec, includePrerelease) {
  // Filter prerelease versions if not included
  let filteredVersions = includePrerelease 
    ? versions 
    : versions.filter(v => !v.includes('-'));
  
  if (versionSpec === 'latest') {
    return filteredVersions[filteredVersions.length - 1];
  }
  
  // Handle x-range expressions like 5.x, 5.11.x
  if (versionSpec.endsWith('.x') || versionSpec.endsWith('.*')) {
    const prefix = versionSpec.replace(/\.(x|\*)$/, '.');
    const matchingVersions = filteredVersions.filter(v => v.startsWith(prefix));
    return matchingVersions.length > 0 ? matchingVersions[matchingVersions.length - 1] : null;
  }
  
  // Exact match
  if (filteredVersions.includes(versionSpec)) {
    return versionSpec;
  }
  
  throw new Error(`Could not find GitVersion version matching: ${versionSpec}`);
}

async function installGitVersion(versionSpec, includePrerelease) {
  try {
    // Get available versions
    const versions = await getNuGetPackageVersions('GitVersion.Tool');
    const version = await findVersion(versions, versionSpec, includePrerelease);
    
    if (!version) {
      throw new Error(`Could not find GitVersion version matching: ${versionSpec}`);
    }
    
    console.log(`Installing GitVersion.Tool version ${version}`);
    
    // Install GitVersion.Tool global tool
    const args = ['tool', 'install', '--global', 'GitVersion.Tool', '--version', version];
    await exec.exec('dotnet', args);
    
    // Verify installation
    await exec.exec('dotnet-gitversion', ['--version']);
    
    // Add GitVersion to the path
    let toolPath;
    if (process.platform === 'win32') {
      toolPath = path.join(process.env.USERPROFILE, '.dotnet', 'tools');
    } else {
      toolPath = path.join(process.env.HOME, '.dotnet', 'tools');
    }
    
    core.addPath(toolPath);
    
    console.log(`GitVersion.Tool version ${version} installed successfully`);
  } catch (error) {
    throw new Error(`Failed to install GitVersion: ${error.message}`);
  }
}

run(); 