$.L = [
 {
    distance: 10000,
    bg: 'Bg1',
    bgSettings: {speed: 400},
    baddies: [],
    waveSize: 3,
    interval: 3,
    init: [
      ['Crate', {}],
      ['Crate', {y: 40}]
    ]
  },
  {
    distance: 10000,
    bg: 'Bg1',
    bgSettings: {speed: 400},
    baddies: ['straightBot'],
    waveSize: 3,
    interval: 3,
    init: [
      ['Crate', {}],
      ['Crate', {y: 40}]
    ]
  },
  {
    distance: 10000,
    bg: 'Bg1',
    powerup: 1,
    bgSettings: {speed: 400},
    baddies: ['sway', 'straightTop'],
    waveSize: 4,
    interval: 3,
    init: [
      ['Crate', {}]
    ]
  },
  {
    distance: 10000,
    bg: 'Bg1',
    powerup: 3,
    bgSettings: {speed: 400},
    baddies: ['topbot', 'bottop'],
    waveSize: 5,
    interval: 3,
    init: [
      ['Spark', {y: 150}]
    ]
  },
  {
    distance: 20000,
    bg: 'Bg2',
    powerup: 4,
    bgSettings: {speed: 400},
    baddies: ['topbot', 'bottop', 'circle'],
    waveSize: 5,
    interval: 2,
    init: [
      ['Crate', {}],
      ['Crate', {y: 40}]
    ]
  },
  {
    distance: 20000,
    bg: 'Bg2',
    powerup: 3,
    bgSettings: {speed: 600},
    baddies: ['all'],
    waveSize: 5,
    interval: 2,
    init: [
      ['Crate', {}],
      ['Crate', {y: 40}]
    ]
  }
];
