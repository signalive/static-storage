'use strict';

module.exports = function(config) {
    const strategy = config.staticstorage.strategy;

    if (!strategy)
        throw new Error('Please define staticstorage:strategy in the configuration file.');

    const strategyName = require('./' + strategy);
    return new strategyName(config);
}
