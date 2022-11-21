# How to use

Clone repository. Navigate in respective addon directory ([geotabdrive-sygic-addin](geotabdrive-sygic-addin) or [mygeotab-sygic-page](mygeotab-sygic-page))

To run locally run following in respective folders:

```
npm install
npm run serve
```
# Deployment
1. To increase version, go to respective files and update _version_ ([geotabdrive-sygic-addin/package.json](geotabdrive-sygic-addin/package.json), [mygeotab-sygic-page/package.json](mygeotab-sygic-page/package.json)). It will create a single [config.json](config.json) for both addons. Update version in [config.json](config.json) as well (best would be to keep everything - all addons - in sync).

[geotabdrive-start-sygic-addin/package.json](geotabdrive-start-sygic-addin/package.json) addon has to be added separately (registration of two DriveAppLink/ addons doesn't go well in Geotab). Just use [geotabdrive-start-sygic-addin/dist/config.json](geotabdrive-start-sygic-addin/dist/config.json) for addon registration.
2. To build production version run following command in root folder. It will run respective build scripts for geotabdrive addins and mygeotab page. 
```
npm run build
```
3. Don't forget to [create a release on github](https://docs.github.com/en/repositories/releasing-projects-on-github/managing-releases-in-a-repository) with specified version tag (e.g. _v1.0.1_).

To ensure proper sygic-geotab-utils module inclusion in both projects you need to:

1. ```cd ~/sygic-geotab-utils && npm link```
2. ```cd ~/mygeotab-sygic-page && npm link sygic-geotab-utils```
3. ```cd ~/geotabdrive-sygic-addin && npm link sygic-geotab-utils```

## My Geotab Sygic Page

This page allows you to set dimensions of 'Devices' ([see here](mygeotab-sygic-page/src/app/scripts/main.js#L232)).

To install the page in mygeotab UI use this [config.json](mygeotab-sygic-page/dist/config.json)

![My Geotab Sygic Addin Page](mygeotab-sygic-page.png)

### Sequence diagram

![My Geotab Sygic Addin Page](mygeotab-sygic-page-sequence.png)

### System architecture diagram

![My Geotab Sygic Addin Page](mygeotab-sygic-page-architecture.png)

## Geotab Drive Sygic Addin

This addin allows you to use [Sygic Professional Navigation](https://www.sygic.com/enterprise/professional-gps-navigation-sdk) to navigate to assigned 'Routes' of type 'Plan' to your 'Device' in the future (starting from now) ([see here](https://github.com/Sygic/sygic.github.io/blob/master/geotab/geotabdrive-sygic-addin/src/app/scripts/main.js#L189))

To install the addin in Geotab Drive APP use this [config.json](geotabdrive-sygic-addin/dist/config.json)

![Geotab Drive Sygic Addin](geotabdrive-sygic-addin.png)

### Sequence diagram

![Geotab Drive Sygic Addin](geotabdrive-sygic-addin-sequence.png)

### System architecture diagram

![Geotab Drive Sygic Addin](geotabdrive-sygic-addin-architecture.png)

## Security and access rights

To view vehicles in the list a user must have **"List devices"** (securityIdentifier: DeviceList) and **"View Add-in data"** (securityIdentifier: ViewAddInData) feature access in his security clearance.

To modify vehicle dimensions a user must have **"Administer devices"** (securityIdentifier: DeviceAdmin) and **Manage Add-in data** (securityIdentifier: ManageAddInData) feature access in his security clearance.

## Geotab login credentials
1. You need to have an account at the testing server https://my1291.geotab.com/
2. Login with your username + password and use sygic_test DB when prompted.

## Geotab documentation reference
https://geotab.github.io/sdk/software/guides/developing-addins/

Contact: [os-team@sygic.com](mailto:os-team@sygic.com)
