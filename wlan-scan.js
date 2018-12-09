'use strict';

const wifiList = require('wifi-list');
const mongoose = require('mongoose');
const dateTime = require('node-datetime');
const Schema = mongoose.Schema;

/**
 * Connects to preexisting MongoDb Hotspot
 */
mongoose.connect('mongodb://localhost/Hotspot', { useNewUrlParser: true }).catch(err => { throw new err });

/**
 * Validates and creates consistent connection to MongoDb
 */
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));

/**
 * Creates MongoDb Schema
 */
const hotspotSchema = new Schema({
  name: String,
  bssid: String,
  channel: Number,
  signal: Number,
  highThroughputMode: Boolean,
  countryCode: String,
  security: String,
  createdAt: String
});

/**
 * Uses {hotspotSchema} to create a collection for wlan data to be stored
 *
 * @type {Model}
 */
const Hotspot = mongoose.model('Hotspot', hotspotSchema);

/**
 * Async function that scans the local available wireless networks on interface specified
 * these are sent to mongoDb if they do not already exist
 *
 * @returns {Promise<void>}
 */
async function wifiScan() {
  return await wifiList((err, list) => {
    if (err) return err;
    for (let item in list) {
      const dt = dateTime.create();
      const timeNow = dt.format('Y-m-d H:M:S');
      Hotspot.countDocuments({name: list[item].name}, ((err, count) => {
        if (count !== 1) {
          let hotspot = new Hotspot({
            name: list[item].name,
            bssid: list[item].bssid,
            channel: list[item].channel,
            signal: list[item].signal,
            highThroughputMode: list[item].highThroughputMode,
            countryCode: list[item].countryCode,
            security: list[item].security,
            createdAt: timeNow
          });
          hotspot.save((err, hotspot) => {
            console.log(`${timeNow} document added :: ${hotspot.name} - ${hotspot.bssid}`);
          }).catch(err => {
            console.error(err);
          });
       }
    }));
  }
  })
}

/**
 * Updates the database every 30000ms with latest available data
 */
setInterval(() => {
  wifiScan().catch((err => { console.error(err, 'Critical Error')}));
}, 36000);
