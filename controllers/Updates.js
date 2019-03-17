const mongoose = require('mongoose');
const moment = require('moment');

const User = mongoose.model('User');

const usersToUpdate = [
  'kruffins@tsiny.org',
  'skeejazaka@yahoo.com',
  'julie.peterson49@yahoo.com',
  'awdaniels12@yahoo.com',
  'apopp@weatherproexteriors.com',
  'chucha1981@yahoo.com',
  'amber.morgan@mmcagents.com',
  'twestton@gmail.com',
  'shelby.wohler@gmail.com',
  'tyler.m.deleo@gmail.com',
  'dccoxx@aol.com',
  'tanner@myminicasa.com',
  'mindy@johnboos.com',
  'cathy.suzanne.ford@gmail.com',
  'raimiejo@gmail.com',
  'mniutei@gmail.com',
  'irina.serbanescu@myminicasa.com',
  'tracysumm@yahoo.com',
  'cnjackson8@gmail.com',
  'edithsantos2121@gmail.com',
  'nichole78@gmail.com',
  'aimeemcmullin@gmail.com',
  'huntonj0@gmail.com',
  'trogers@eisd.org',
  'iconthetruth@gmail.com',
  'hvaitai@aol.com',
  'ssgttambo@gmail.com',
  'dyan.ogbe@jefferson.kyschools.us',
  'mschlax@gmail.com',
  'valindalwood@gmail.com',
  'codyhud20@gmail.com',
  'etonitonga@yahoo.com',
  'tjross4648@gmail.com',
  'mjj1225@yahoo.com',
  'falahola77@gmail.com',
  'verif@mailinator.com',
  'norelis7911@gmail.com',
  'audrey.alcazar@gmail.com',
  'klee093@gmail.com',
  'gbarnes977@gmail.com',
  'sreeves@gvcmortgage.com',
  'crystalstaxserv@att.net',
  'mshue@republicservices.com',
  'jennifermstehly@gmail.com',
  'hrobbins@gvcmortgage.com',
  'martha_don@yahoo.com',
  'jonesdarren1992@gmail.com',
  'astark028@aol.com',
  'tradaniel@gmail.com',
  'navas05@comcast.net',
  'jenilee.silva@gmail.com',
  'emily.dennis1@hotmail.com',
  'j.avila07@me.com',
  'rowens794@mailinator.com',
  'start@mailinator.com',
  'ecd1027@wildcats.unh.edu',
  'eula.lino@gmail.com',
  'lilyf84@gmail.com',
  'evelyn.omarah@gmail.com',
  'michelle.thibault95@gmail.com',
  'diane.bonebrake@yahoo.com',
  'ms_behaving_ca@yahoo.com',
  'abucklerpta@gmail.com',
  'danigreen0515@gmail.com',
  'ashley_lawson17@yahoo.com',
  'cfick@planitagency.com',
  'angelajeff22@yahoo.com',
  'miles.montgomery97@gmail.com',
  'eileen_kata@yahoo.com',
  'rosalesjuana107@gmail.com',
  'mirsaeli_roher@hotmail.com',
  'maebanks@hcmg.com',
  'davidbennert@gmail.com',
  'jerimee.haiman@hcmg.com',
  'aaliyahjack06@gmail.com',
  'psimmons47932@yahoo.com',
  'alilucas@comcast.net',
  'amartin731@gmail.com',
  'chrishooton11@gmail.com',
  'gtm9866@gmail.com',
  'ekmajors@live.com',
  'uhrigchris@gmail.com',
  'karen.vas99@gmail.com',
  'dvaitai6@gmail.com',
  'salcorn@laerrealty.com',
  'msrpreston@gmail.com',
  'starwarrior840@gmail.com',
  'crystalgiselle@gmail.com',
  'jpteach03@gmail.com',
  'jmaje001@gmail.com',
  'pkbrookings@gmail.com',
  'bdhouser@ptd.net',
  'zolivrrconstruction@gmail.com',
  'leffingwell72@gmail.com',
  'traci.craig@viaquestinc.com',
  'jtmaki2003@yahoo.com',
  'kebutler14@yahoo.com',
  'allen@mailinator.com',
  'trisha.r.thomas@outlook.com',
  'sherrysmk26@gmail.com',
  'bram.begonia@usw.salvationarmy.org',
];

exports.updateDB = async (req, res) => {
  var lastSend = moment(new Date()).format('M/D/YYYY');
  var nextSend = moment(new Date()).format('M/D/YYYY');

  usersToUpdate.forEach((email) => {
    User.find({ email: email }, async (usersRetrievalError, results) => {
      const user = results[0];
      if (user) {
        user.marketingEmails = {
          lastSend,
          nextSend,
          nextEmailToSend: 2,
        };

        user.markModified();
        user.save();
      }
    });
  });

  res.json({ status: 'success' });
};
