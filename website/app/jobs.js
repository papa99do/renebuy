var schedule = require('node-schedule');
var dwPriceUpdater = require('./handlers/cw-price-updater');

// run sheduled job to update price every day
var updatePriceJobCron = '0 1 * * *';
function scheduleUpdateDwPriceJob() {
  schedule.scheduleJob(updatePriceJobCron, function() {
    console.log("====JOB(dwPriceUpdater)==== Start updating prices");
  	dwPriceUpdater.updatePrices(function() {
      console.log("====JOB(dwPriceUpdater)==== Done: All prices updated");
    });
  });
}

module.exports = {
  scheduleJobs: function() {
    scheduleUpdateDwPriceJob();
  }
};
