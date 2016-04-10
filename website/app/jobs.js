var schedule = require('node-schedule');
var dwPriceUpdater = require('./handlers/dw-price-updater');

// run sheduled job to update price every day
var updatePriceJobCron = '10 * * * *'; 
function scheduleUpdateDwPriceJob() {
  schedule.scheduleJob(updatePriceJobCron, function() {
  	dwPriceUpdater.updatePrices();
  });
}

module.exports = {
  scheduleJobs: function() {
    scheduleUpdateDwPriceJob();
  }
};
