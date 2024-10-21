const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

module.exports = {
    getSigningIdentities: getSigningIdentities,
    getProvisioningProfiles: getProvisioningProfiles
}

function getSigningIdentities() {
    return new Promise((resolve, reject) => {
        exec('security find-identity -p codesigning -v', (error, stdout, stderr) => {
            if (error) {
                console.error(`Error executing command: ${error.message}`);
                reject(error);
                return;
            }

            if (stderr) {
                console.error(`Command stderr: ${stderr}`);
                reject(stderr);
                return;
            }

            const lines = stdout.split('\n');
            const signingIdentities = [];

            lines.forEach((line) => {
                const match = line.match(/^\s*\d+\)\s+([0-9A-F]+)\s+"(.+)"$/);
                if (match && match.length === 3) {
                    const identity = match[2];
                    signingIdentities.push(identity);
                }
            });

            // Remove duplicates
            const distinctSigningIdentities = [...new Set(signingIdentities)];

            console.log('Distinct Signing Identities:', distinctSigningIdentities);
            resolve(distinctSigningIdentities);
        });
    });
}

function getProvisioningProfiles() {
    const provisioningProfiles = [];
    let pre16Profiles = getPreXcode16ProvisioningProfiles();
    let currentProfiles = getXcode16ProvisioningProfiles();
    for(let i = 0; i < pre16Profiles.length; i++) {
        provisioningProfiles.push(pre16Profiles[i]);
    }
    for(let i = 0; i < currentProfiles.length; i++) {
        provisioningProfiles.push(currentProfiles[i]);
    }
    return provisioningProfiles;
}

function getPreXcode16ProvisioningProfiles() {
    const provisioningProfilesPath = path.join(process.env.HOME, 'Library', 'MobileDevice', 'Provisioning Profiles');

    try {
        const files = fs.readdirSync(provisioningProfilesPath);

        const profiles = files.map((file) => {
            const filePath = path.join(provisioningProfilesPath, file);
            try {
                const content = fs.readFileSync(filePath, 'utf-8');
                const expirationDateMatch = content.match(/<key>ExpirationDate<\/key>\s*<date>([^<]+)<\/date>/);
                const nameMatch = content.match(/<key>Name<\/key>\s*<string>([^<]+)<\/string>/);

                if (expirationDateMatch && expirationDateMatch[1] && nameMatch && nameMatch[1]) {
                    const expirationDate = new Date(expirationDateMatch[1]);
                    const name = nameMatch[1];

                    const currentDate = new Date();
                    if (expirationDate > currentDate) {
                        return { name, expirationDate };
                    }
                }
            } catch (error) {
                console.error(`Error reading or parsing file ${filePath}: ${error.message}`);
            }

            return null;
        }).filter(Boolean);

        return profiles;
    } catch (error) {
        console.error(`Error reading provisioning profiles: ${error.message}`);
        return [];
    }
}

function getXcode16ProvisioningProfiles() {
    const provisioningProfilesPath = path.join(process.env.HOME, 'Library', 'Developer', 'Xcode', 'UserData', 'Provisioning Profiles');

    try {
        const files = fs.readdirSync(provisioningProfilesPath);

        const profiles = files.map((file) => {
            const filePath = path.join(provisioningProfilesPath, file);
            try {
                const content = fs.readFileSync(filePath, 'utf-8');
                const expirationDateMatch = content.match(/<key>ExpirationDate<\/key>\s*<date>([^<]+)<\/date>/);
                const nameMatch = content.match(/<key>Name<\/key>\s*<string>([^<]+)<\/string>/);

                if (expirationDateMatch && expirationDateMatch[1] && nameMatch && nameMatch[1]) {
                    const expirationDate = new Date(expirationDateMatch[1]);
                    const name = nameMatch[1];

                    const currentDate = new Date();
                    if (expirationDate > currentDate) {
                        return { name, expirationDate };
                    }
                }
            } catch (error) {
                console.error(`Error reading or parsing file ${filePath}: ${error.message}`);
            }

            return null;
        }).filter(Boolean);

        return profiles;
    } catch (error) {
        console.error(`Error reading provisioning profiles: ${error.message}`);
        return [];
    }
}