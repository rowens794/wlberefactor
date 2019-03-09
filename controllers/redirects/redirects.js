const mongoose = require('mongoose');
const Sentry = require('@sentry/node');

const ClickTracking = mongoose.model('ClickTracking');

exports.beachbodyod = async (req, res) => {
  console.log(req.query.id);
  ClickTracking.create(
    {
      EmailName: 'You Are In',
      UserID: req.query.id,
      LinkSource: 'Beachbody OnDemand',
      ClickDate: new Date(),
    },
    (ClickTrackingSaveError) => {
      if (ClickTrackingSaveError) {
        Sentry.captureMessage('Failed to create Click Tracking Record');
      }
    },
  );
  res.redirect('https://www.teambeachbody.com/shop/d/BODStandalone?referringRepID=1890747');
};
