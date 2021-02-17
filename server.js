const Sequelize = require('sequelize');
const { DataTypes } = Sequelize;
const db = new Sequelize(
  process.env.DATABASE_URL || 'postgres://localhost/acme_country_club',
  { logging: false }
);

const express = require('express');
const app = express();

app.get('/', async (req, res, next) => {
  try {
    res.send(`
    <html>
      <body>
        <h1><a href='/api/members'>Members</a></h1>
        <h1><a href='/api/facilities'>Facilities</a></h1>
        <h1><a href='/api/bookings'>Bookings</a></h1>
      </body>
    </html>
    `);
  } catch (ex) {
    next(ex);
  }
});

app.get('/api/members', async (req, res, next) => {
  const members = await Member.findAll({
    include: {
      model: Member,
      as: 'sponsor',
    },
  });
  try {
    res.send(members);
  } catch (ex) {
    next(ex);
  }
});

// app.get('/api/bookings', async (req, res, next) => {
//   const members = await Member.findAll({
//     include: {
//       model: Member,
//       as: 'sponsor',
//     },
//   });
//   try {
//     res.send(members);
//   } catch (ex) {
//     next(ex);
//   }
// });

const Facility = db.define('facility', {
  id: {
    type: DataTypes.UUID,
    primaryKey: true,
    defaultValue: DataTypes.UUIDV4,
  },
  fac_name: {
    type: DataTypes.STRING(100),
    unique: true,
    allowNull: false,
  },
});

const Member = db.define('member', {
  id: {
    type: DataTypes.UUID,
    primaryKey: true,
    defaultValue: DataTypes.UUIDV4,
  },
  first_name: {
    type: DataTypes.STRING(20),
    unique: true,
    allowNull: false,
  },
});

const Booking = db.define('booking', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  startTime: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  endTime: {
    type: DataTypes.DATE,
    allowNull: false,
  },
});

Member.hasOne(Member, { as: 'sponsor' });
Booking.belongsTo(Member);
Booking.belongsTo(Facility);
Facility.hasMany(Booking);
Member.hasMany(Booking);

const syncAndSeed = async () => {
  await db.sync({ force: true });
  const [tennis, pool, gym, joe, mary, bob, b1, b2, b3, b4] = await Promise.all(
    [
      Facility.create({ fac_name: 'tennis' }),
      Facility.create({ fac_name: 'pool' }),
      Facility.create({ fac_name: 'gym' }),
      Member.create({ first_name: 'joe' }),
      Member.create({ first_name: 'mary' }),
      Member.create({ first_name: 'bob' }),
      Booking.create({
        startTime: '2020-03-06 08:30:00',
        endTime: '2020-03-06 09:30:00',
      }),
      Booking.create({
        startTime: '2019-08-22 02:00:00',
        endTime: '2019-08-22 03:00:00',
      }),
      Booking.create({
        startTime: '2021-01-15 12:00:00',
        endTime: '2021-01-15 01:00:00',
      }),
      Booking.create({
        startTime: '2020-03-06 08:30:00',
        endTime: '2020-03-06 09:30:00',
      }),
    ]
  );
  joe.sponsorId = mary.id;
  mary.sponsorId = bob.id;
  b1.memberId = bob.id;
  b1.facilityId = tennis.id;
  b2.memberId = mary.id;
  b2.facilityId = gym.id;
  b3.memberId = joe.id;
  b3.facilityId = pool.id;
  b4.memberId = mary.id;
  b4.facilityId = pool.id;

  await Promise.all([joe.save(), mary.save(), b1.save(), b2.save(), b3.save()]);
};

const init = async () => {
  try {
    await db.authenticate();
    await syncAndSeed();
    const port = process.env.PORT || 3000;
    app.listen(port, () => console.log(`listening on port: ${port}`));
  } catch (ex) {
    console.log(ex);
  }
};

init();
