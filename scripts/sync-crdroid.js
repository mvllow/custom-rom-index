#!/usr/bin/env node

const _got = require('got');

const conch = require('@barelyreaper/conch');
const { logcons } = require('logcons');
const kluer = require('kleur');
const { STATUS_ENUM } = require('../db/status_enum');
const { upsertDevice } = require('../lib/sdk');
const info = kluer.cyan().bold;
const success = kluer.green().bold;

const V11_COMMIT =
  'https://api.github.com/repos/crdroidandroid/android_vendor_crDroidOTA/branches/11.0';
const V10_COMMIT =
  'https://api.github.com/repos/crdroidandroid/android_vendor_crDroidOTA/branches/10.0';

async function main() {
  await addV11Devices();
  await addV10Devices();
  console.log(success(`${logcons.tick()} Done, Syncing CRDroid`));
}

async function addV11Devices() {
  const { parse } = JSON;
  const response = await got(V11_COMMIT);
  const repoTreeUrl = parse(response.body).commit.commit.tree.url;
  const repoTreeResponse = await got(repoTreeUrl);

  const devicesToSync = parse(repoTreeResponse.body).tree.filter(
    item =>
      !item.path.includes('changelog') &&
      item.type === 'blob' &&
      String(item.path).endsWith('.json')
  );

  await conch(devicesToSync, item => addCRDroidToDevices(item, 11), {
    limit: 1,
  });
  console.log(info(`${logcons.info()} Synced: 11.0 crDroid`));
}

async function addV10Devices() {
  const { parse } = JSON;
  const response = await got(V10_COMMIT);
  const repoTreeUrl = parse(response.body).commit.commit.tree.url;
  const repoTreeResponse = await got(repoTreeUrl);

  const devicesToSync = parse(repoTreeResponse.body).tree.filter(
    item =>
      !item.path.includes('changelog') &&
      item.type === 'blob' &&
      String(item.path).endsWith('.json')
  );

  await conch(devicesToSync, item => addCRDroidToDevices(item, 10), {
    limit: 10,
  });
  console.log(info(`${logcons.info()} Synced: 10.0 crDroid`));
}

async function addCRDroidToDevices(item, version) {
  const { parse } = JSON;
  const deviceBlob = await got(item.url);
  const fileContent = Buffer.from(
    parse(deviceBlob.body).content,
    'base64'
  ).toString('utf8');

  if (!fileContent) return true;

  let parsedFileData;
  try {
    parsedFileData = parse(fileContent);
  } catch (_) {
    parsedFileData = false;
  }

  if (!parsedFileData) return true;

  const deviceData =
    (parsedFileData.response && parsedFileData.response[0]) || false;

  if (!deviceData) return true;

  const codename = item.path.replace('.json', '');
  await upsertDevice({
    deviceName: deviceData.device,
    codename,
    rom: {
      status: STATUS_ENUM.unknown,
      androidVersion: [version],
      links: [deviceData.forum],
      name: 'crDroid',
    },
  });
}

function got(url) {
  return _got(url, {
    headers: {
      Authorization: `token ${process.env.GH_TOKEN}`,
    },
  });
}

exports.syncCRAndroid = main;

if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch(err => {
      console.error(err);
      process.exit(1);
    });
}
