'use strict';

/* http://www.wowwiki.com/Quotes_of_Warcraft_II */

var motd = {};

motd['Human Alliance'] = {
  Peasant: [
    'Ready to serve.',
    'Yes?',
    'My lord?',
    'What is it?',
    'Hello.',
    'Okay.',
    'Right.',
    'Alright.',
    'Yes my lord!',
    'Job\'s done.',
    'Oh, what?',
    'Y—uh-huh.',
    'Now what?',
    'More work?',
    'Leave me alone!',
    'I don\'t want to do this!',
    'I\'m not listening.'
  ],
  Footman: [
    'Awaiting orders.',
    'Your command?',
    'Your orders?',
    'Yes, sire?',
    'Yes?',
    'My lord?',
    'Yes.',
    'Yes, my lord.',
    'As you wish.',
    'At once, sire.',
    'At your service.',
    'Work completed.',
    'Make up your mind.',
    'Are you still touching me?',
    'Don\'t you have a kingdom to run?',
    'I do have work to do.',
    '\'Join the army,\' they said.',
    '\'See the world,\' they said.',
    'I\'d rather be sailing.',
    'We are under attack!',
    'The town is under attack!'
  ],
  'Elven Archer/Ranger': [
    'I come to serve.',
    'Your Eminence?',
    'Exalted one?',
    'My sovereign?',
    'Your wish?',
    'Yes.',
    'By your command.',
    'For the Alliance.',
    'Move out.',
    'We must take action.',
    'Time is of the essence.',
    'Even elder races get tired of waiting.'
  ],
  'Knight/Paladin': [
    'Ready to serve, my lord.',
    'Your majesty?',
    'At your service.',
    'Sire?',
    'What ho!',
    'We move.',
    'In your name.',
    'For the king.',
    'Defending your honour.',
    'I need orders.',
    'Give me a quest!',
    'Don\'t force me to run you through!'
  ],
  'Gnomish Flying Machine': [
    'I\'ve got a flying machine!',
    'Hello, sonny.',
    'Want me to fly?',
    'Are you listening?',
    'I\'m flying...',
    'Goodbye...'
  ],
  'Dwarven Demo Squad': [
    'Dwarves ready.',
    'What do you want?',
    'Ach?',
    'Aye laddy.',
    'OK.',
    'Alright.',
    'Move out.',
    'Yes sir.',
    'I love blowin\' things up!',
    'Bombs are great!',
    'Tilt one back with me, dog!'
  ],
  Mage: [
    'Who summoned me?',
    'What is it?',
    'Do you need assistance?',
    'Your request?',
    'As you wish.',
    'Very well.',
    'Alright.',
    'I\'m a busy man.',
    'Don\'t anger me.',
    'I warned you.'
  ],
  'Alliance Ships': [
    'Captain on the bridge.',
    'Aye, captain?',
    'Skipper?',
    'Set sail?',
    'Aye, aye, sir.',
    'Aye, Captain.',
    'Under way.',
    'Stop rocking the boat!',
    'You\'re making me seasick!'
  ]
};

motd['Orcish Horde'] = {
  Peon: [
    'Ready to work.',
    'Zug Zug.',
    'Dabu.',
    'Lok\'tar.',
    'What?!',
    'Look out!',
    'Missed me!',
    'Hee hee hee! That tickles.',
    'I would not do such things if I were you.',
    'My tummy feels funny.',
    '(burp) \'\'scuse me.'
  ],
  Grunt: [
    'Your command, master.',
    'Zug Zug.',
    'Dabu.',
    'Lok\'tar.',
    'Why you poking me again??',
    'Swobu',
    'What?!',
    'Look out!',
    'Missed me!',
    'Hee hee hee! That tickles.',
    'I would not do such things if I were you.',
    'My tummy feels funny.',
    '(burp) \'\'scuse me.',
    'You\'re good looking for a human.'
  ],
  'Troll Axethrower/Berserker': [
    'New troll here!',
    'D\'you call me?',
    'What you wan\'me kill?',
    'OK.',
    'Alright.',
    'You\'re the boss.',
    'D\'you want axe?',
    'I got axe for you!',
    'Say hello to my little friend!'
  ],
  'Two-headed Ogre': [
    'We\'re ready, master.',
    'I\'m not ready.',
    'Huh?',
    'What?',
    'What?',
    'Huh?',
    'Yes?',
    'Master?',
    'Okay.',
    'Yes, master.',
    'Alright.',
    'Yes, master.',
    'I don\'t want to!',
    'All right.',
    'No, I\'m hungry.',
    'This way.',
    'No, that way.',
    'He did it!',
    'No, he did it!'
  ],
  'Ogre Mage': [
    'We\'re ready, master.',
    'Yes, master?',
    'What?',
    'Yes?',
    'What is it?',
    'Yes, master.',
    'Of course.',
    'Right away.',
    '(burp) \'We did it.',
    'We\'re not brainless anymore.',
    'I\'ve got the brains.',
    'Nuh-uh!'
  ],
  'Goblin Zeppelin': [
    'Here I am.',
    'I can see my house!',
    'I wish I had a weapon!'
  ],
  'Death Knight': [
    'I\'m alive!',
    'Yes?',
    'Make it quick.',
    'Of course master.',
    'Very well.',
    'Grrr.',
    'I\'m growing impatient.',
    'Don\'t push it.',
    'When my work is finished, I\'m coming back for you.'
  ],
  'Goblin Sappers': [
    'We\'re ready.',
    'What?',
    'Yes?',
    'Who is it?',
    'Hello?',
    'OK.',
    'Certainly.',
    'Yes, boss.',
    'Alright.',
    'We\'ve got explosives!',
    'KABOOOOOM!',
    '(singing) Ooooh, it\'s beautiful!'
  ],
  'Orc Ships': [
    'Done building ship.',
    'Aye, matey?',
    'Yes, Captain?',
    'Ahoy.',
    'I would love to.',
    'You\'re the captain.',
    'Yo ho!',
    'Who wants to sing?'
  ]
};

exports.get = function () {
  var raceArray = Object.keys (motd);
  var race = raceArray[parseInt (Math.floor (Math.random () * raceArray.length))];

  var unitArray = Object.keys (motd[race]);
  var unit = unitArray[parseInt (Math.floor (Math.random () * unitArray.length))];

  var text = motd[race][unit][parseInt (Math.floor (Math.random () * motd[race][unit].length))];
  return {
    race: race,
    unit: unit,
    text: text
  };
};
