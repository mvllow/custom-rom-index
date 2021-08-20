#!/usr/bin/env node
const { generateDevices } = require('./generate-devices')
const { syncCRAndroid } = require('./sync-crdroid')
const { syncDotOS } = require('./sync-dotos')
const { syncLineageOS } = require('./sync-lineage-os')
const { syncLocalReleases } = require('./sync-local-releases')
const { syncPixelExperience } = require('./sync-pixel-experience')
const { logcons } = require('logcons')
const kluer = require('kleur')
const { db } = require('../db/db')
const { syncManualDevices } = require('./sync-manual-devices')
const { syncArrowOS } = require('./sync-arrowos')

const bullet = kluer.white().bold
const success = kluer.green().bold

async function main () {
  db.set('devices', [])
  console.log(bullet('Syncing, Manual Devices...'))
  await syncManualDevices()
  console.log(bullet('Syncing, Pixel Experience...'))
  await syncPixelExperience()
  console.log(bullet('Syncing, Lineage OS...'))
  await syncLineageOS()
  console.log(bullet('Syncing, Dot OS...'))
  await syncDotOS()
  console.log(bullet('Syncing, ArrowOS...'))
  await syncArrowOS()
  console.log(bullet('Syncing, CRDroid...'))
  await syncCRAndroid()
  await generateDevices()
  console.log(bullet('Syncing, Local Release Dates...'))
  syncLocalReleases()
  console.log(success(`${logcons.tick()} Done Syncing everything`))
}

main()
