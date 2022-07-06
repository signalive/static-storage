'use strict';

module.exports = function(config) {
    const strategy = config.staticstorage.strategy;

    if (!strategy)
        throw new Error('No strategy is defined in strategySettings or staticstorage configuration');

    if (strategy !== 'local') {
      if (config.strategySettings) {
        if (!config.strategySettings[strategy])
          throw new Error(`No settings are defined inside 'strategySettings' for strategy ${strategy}`);
        config[strategy] = config.strategySettings[strategy];
      } else {
        const strategies = Object.keys(config).filter(key => key !== 'staticstorage');
        if (!strategies.includes(config.staticstorage.strategy))
          throw new Error(`No settings are defined inside 'strategySettings' for strategy ${strategy}`);

        config.strategySettings = {[strategy]: config[strategy]};
      }
    }

    const storage = require('./' + strategy);
    return new storage(config);
}
