// Relative placement transcribed from IMG_5355 and the IMG_5354 model walkaround.
// Front of the model is +Z; these are gameplay units, not surveyed metres or north.
export const CAMPUS = {
  bounds: {minX:-145,maxX:145,minZ:-58,maxZ:63},
  spawn: {x:38,z:51,yaw:0}, exit: {x:38,z:57},
  buildings: [
    {id:'towers',label:'Balcony towers',x:-122,z:-29,w:19,d:21,h:48},
    {id:'research',label:'Stepped tower',x:-119,z:11,w:26,d:23,h:40},
    {id:'archive',label:'West teaching block',x:-77,z:1,w:37,d:24,h:13},
    {id:'crescent',label:'Curved building',x:-21,z:-9,w:79,d:64,h:14},
    {id:'arcade',label:'Rear arcade',x:43,z:-41,w:74,d:13,h:12},
    {id:'academic',label:'East teaching block',x:69,z:4,w:33,d:29,h:17},
    {id:'gym',label:'Sports hall',x:107,z:6,w:28,d:26,h:11},
    {id:'dorms',label:'Dormitory blocks',x:104,z:-34,w:65,d:17,h:29},
  ],
  stations: [
    {id:'greenhouse',title:'Water court',kind:'reflection',position:{x:-20,z:17},approach:{x:-20,z:20}},
    {id:'library',title:'West teaching block',kind:'listen',position:{x:-77,z:4},approach:{x:-77,z:6}},
    {id:'observatory',title:'Sports hall',kind:'track',position:{x:107,z:9},approach:{x:107,z:11}},
    {id:'residence',title:'Dormitory arcade',kind:'echo',position:{x:103,z:-22},approach:{x:103,z:-19.5}},
  ],
  safeZones:[{x:38,z:39,r:5.8},{x:-20,z:28,r:5},{x:-77,z:23,r:5},{x:42,z:-25,r:5},{x:92,z:26,r:5},{x:104,z:-18,r:4.5}],
  // Walks follow front promenade, garden lip, arcade and east sports/dorm lane.
  paths:[[[38,57],[38,39],[38,26],[-129,26]],[[38,26],[134,26]],
    [[-20,28],[-20,17]],[[-77,26],[-77,4]],[[38,26],[38,-25],[135,-25]],
    [[90,26],[90,-18],[135,-18]],[[107,26],[107,9]],[[103,-18],[103,-22]],
    [[-99,26],[-99,-43],[12,-43]],[[24,-25],[38,-25]]],
  track:{x:126,z:42,w:27,d:27,checkpoints:[{x:114,z:42},{x:126,z:52},{x:138,z:42},{x:126,z:32}]},
  zombieSpawns:[[38,44],[-48,26],[-90,18],[48,-22],[92,22],[120,-18]],
  ghostPatrol:[{x:15,z:26},{x:-47,z:26},{x:-92,z:18},{x:38,z:-25},{x:92,z:22},{x:130,z:26}],
};
export const MEMORY_TITLES={library:'The corridor whisper',greenhouse:'The water reflection',observatory:'The final lap',residence:'The room-call melody'};
