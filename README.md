# Development guide

Clone repository. Navigate in respective addon directory ([geotabdrive-sygic-addin](geotabdrive-sygic-addin) or [mygeotab-sygic-page](mygeotab-sygic-page))

### Before you start
To ensure proper sygic-geotab-utils module inclusion in both projects you need to:

1. ```cd ~/sygic-geotab-utils && npm link```
2. ```cd ~/mygeotab-sygic-page && npm link sygic-geotab-utils```
3. ```cd ~/geotabdrive-sygic-addin && npm link sygic-geotab-utils```
4. ```cd ~/sygic-geotab-utils && npm run compile```

### Run and develop
To run locally run following in respective folders:

```
npm install
npm run serve
```

#### Troubleshooting
If you run into this error:
```
node:internal/crypto/hash:68
  this[kHandle] = new _Hash(algorithm, xofLen);
```
Try to apply this environment variable:

Windows: `$env:NODE_OPTIONS="--openssl-legacy-provider yarn dev"`

## Deployment

### Automated Release (Recommended)

The repository includes a GitHub Actions workflow that automates the entire release process:

1. **Trigger the workflow**:
   - Go to GitHub → **Actions** tab
   - Select **Release** workflow
   - Click **Run workflow**
   - Enter the version number:
     - For stable releases: `1.2.3`
     - For prereleases: `2.0.6-beta`, `2.0.6-rc.1`, etc.
   - Click **Run workflow**

2. **What happens automatically**:
   - Updates version in all package.json files
   - Sets up and links sygic-geotab-utils
   - Builds all addins for production
   - Commits version updates and dist folders to repository
   - Creates Git tag (e.g., `v1.2.3`)
   - Creates GitHub release with config files
   - Built files become available via jsDelivr CDN

3. **Installing the addins**:
   - Navigate to the [releases page](https://github.com/Sygic/geotab/releases)
   - Open the desired release version
   - Access config files from the `dist/` folder in the repository:
     - For Truck Settings: `dist/1.2.3/truck-settings-config.json`
     - For Start Sygic Button: `dist/1.2.3/start-sygic-config.json`
   - Go to Geotab → Settings → Add-Ins → Select desired add-in
   - Copy and paste the config content

**Note:** We recommend using concrete version configurations (e.g., `1.2.3`) instead of relying on `latest`.

### Manual Deployment (Alternative)

If you need to build locally without using the automated workflow:

1. Update the version in [package.json](package.json)
2. Run `npm run build` in the root folder
3. Manually commit and push changes
4. Create a GitHub release manually

## Geotab login credentials
1. You need to have an account at the testing server https://my1291.geotab.com/
2. Login with your username + password and use sygic_test DB when prompted.

## Geotab documentation reference
https://geotab.github.io/sdk/software/guides/developing-addins/

# Architecture and functionality overview
## My Geotab Sygic Page

This page allows you to set dimensions of 'Devices' ([see here](mygeotab-sygic-page/src/app/scripts/main.js#L232)).

To install the page in mygeotab UI use this [config.json](dist/latest/truck-settings-config.json)

![My Geotab Sygic Addin Page](mygeotab-sygic-page.png)

### Sequence diagram

![My Geotab Sygic Addin Page](mygeotab-sygic-page-sequence.png)

### System architecture diagram

![My Geotab Sygic Addin Page](mygeotab-sygic-page-architecture.png)

## Geotab Drive Sygic Addin

This addin allows you to use [Sygic Professional Navigation](https://www.sygic.com/enterprise/professional-gps-navigation-sdk) to navigate to assigned 'Routes' of type 'Plan' to your 'Device' in the future (starting from now) ([see here](https://github.com/Sygic/sygic.github.io/blob/master/geotab/geotabdrive-sygic-addin/src/app/scripts/main.js#L189))

To install the addin in Geotab Drive APP use this [config.json](dist/latest/truck-settings-config.json)

![Geotab Drive Sygic Addin](geotabdrive-sygic-addin.png)

### Sequence diagram

![Geotab Drive Sygic Addin](geotabdrive-sygic-addin-sequence.png)

### System architecture diagram

![Geotab Drive Sygic Addin](geotabdrive-sygic-addin-architecture.png)

## Security and access rights

To view vehicles in the list a user must have **"List assets"** (securityIdentifier: DeviceList) and **"View Add-in data"** (securityIdentifier: ViewAddInData) feature access in his security clearance. Without this permissions the addin will display a warning.

To modify vehicle dimensions a user must have **"Administer assets"** (securityIdentifier: DeviceAdmin) and **Manage Add-in data** (securityIdentifier: ManageAddInData) feature access in his security clearance. Without this permissions the addin will not allow to change vehicle dimensions.

To view vehicle assigned Route plans in Geotab Drive Sygic Addin a user must have **"Trips and activity report"** (securityIdentifier: TripsActivityReport) feature access in his security clearance and be an assigned **Driver**. Without this permission the addin will display a warning."

![Permission warnings](geotabdrive-permission-warnings.png)

Contact: [os-team@sygic.com](mailto:os-team@sygic.com)