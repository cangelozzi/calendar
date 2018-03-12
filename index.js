'use strict';
/**
 * hard coded values
 */
const timeUnit = 48;
// const unitInMinute = 48 * 60 / timeUnit;
const unitInterval = 60; // in minutes
const numberOfDays = 7;
const firstDay = new Date(1519621200000); //Feb26th
const lastDay = new Date(firstDay);
lastDay.setDate(firstDay.getDate() + numberOfDays);
const weekdays = [
  'Sun',
  'Mon',
  'Tue',
  'Wed',
  'Thu',
  'Fri',
  'Sat'
]
/**
 * end
 */
let originElement = null;
let scrollElement = null;
let dateElement = null;
let currentElement = null;
let previousScroll = {
  left: null,
  top: null
}
let timeSlots = []; 
let data = {
  events: [
    {
      id:1,
      title:"event 1",
      start:1519653600,// 26 9am
      duration:3600,
    },
    {
      id:2,
      title:"event 2", 
      start:1519729200,// 27 6am
      duration:5400,
    },
    {
      id:3,
      title:"event 3",
      start:1519567200,// 25 9am
      duration:3600,
    },
    {
      id:4,
      title:"event 4 with a super long name abcdabcdabcdabcd",
      start:1519736400,// 27 7am
      duration:3600,
    },
    {
      id:5,
      title:"event 5",
      start:1519880700,// 1 0:05am
      duration:600,
    }
  ]
}

let config = {
  venues:[
    {
      id:1,
      name:"venue 1",
    },
    // {
    //   id:2,
    //   name:"venue 2",
    // },
    // {
    //   id:3,
    //   name:"venue 3",
    // },
    // {
    //   id:4,
    //   name:"venue 4",
    // },
    // {
    //   id:5,
    //   name:"venue 5",
    // },
    // {
    //   id:6,
    //   name:"venue 6",
    // },
    // {
    //   id:7,
    //   name:"venue 7",
    // },
    // {
    //   id:8,
    //   name:"venue 8",
    // },
    // {
    //   id:9,
    //   name:"venue 9",
    // },
    // {
    //   id:10,
    //   name:"venue 10",
    // },
  ]
}

let numberOfVenues = config.venues.length;
let numberOfColumns = numberOfDays * numberOfVenues;

window.onload= ()=>{
  console.log('loading')
  originElement = document.getElementById("originPoint");
  dateElement = document.getElementById("dateScroll");
  scrollElement = document.getElementById("eventScroll");
  scrollElement.addEventListener('scroll', scrollListener);
  previousScroll.left = scrollElement.scrollLeft;
  previousScroll.top = scrollElement.scrollTop;
  console.log(data);
  initializeTimeArea();
  initializeTimeSlots();
  // initializeDateColumn();
  dyanamicallyInitializeDateColumn();
  for(let i = 0; i< data.events.length; i++){
    createEventNode(data.events[i])
  }
}
// target elements with the "draggable" class
interact('.draggable')
.draggable({
  snap: {
    targets: [
      function (x, y) {
        let origin = document.getElementById("originPoint");
        let position = origin.getBoundingClientRect();
        let unitsX = Math.round((x - position.left)/ position.width);
        if(unitsX < 0){
          unitsX = 0;
        }
        if(unitsX >= numberOfColumns){
          unitsX = numberOfColumns - 1;
        }
        let snapX = position.left + unitsX * position.width;
        let unitsY = Math.round((y - position.top)/ timeUnit);
        let snapY = position.top + unitsY * timeUnit;
        if(currentElement != null){
          let duration = currentElement.getAttribute('duration');

          if(isOccupied(unitsX, unitsY, duration / 60 / unitInterval)){
            //snap back
            let startUnitsX = currentElement.getAttribute('unit-x') || 0;
            let startUnitsY = currentElement.getAttribute('unit-y') || 0;
            snapX = position.left + startUnitsX * position.width;
            snapY = position.top + startUnitsY * timeUnit;
          }
        }
        return {x: snapX, y: snapY, range: Infinity}
      },
    ],
    range: Infinity,
    endOnly: true, // soft snapping
    relativePoints: [ { x: 0, y: 0 } ]
  },
  // enable inertial throwing
  inertia: true,
  // keep the element within the area of it's parent
  restrict: {
    restriction: ".eventArea",
    endOnly: true,
    elementRect: { top: 0, left: 0, bottom: 1, right: 1 }
  },
  // enable autoScroll
  // autoScroll: true,
  onstart: interactStart,
  // call this function on every dragmove event
  onmove: dragMoveListener,
  // call this function on every dragend event
  onend: function (event) {
    console.log('end');
    let origin = document.getElementById("originPoint");
    let position = origin.getBoundingClientRect();
    let x = parseFloat(event.target.getAttribute('data-x')) || 0;
    let y = parseFloat(event.target.getAttribute('data-y')) || 0;
    let previousX = event.target.getAttribute('unit-x');
    let previousY = event.target.getAttribute('unit-y');
    let duration = event.target.getAttribute('duration');
    let unitsX = Math.round(x/ position.width);
    let unitsY = Math.round(y/ timeUnit);
    if(previousX == unitsX && previousY == unitsY){
      // snpped back
    } else {
      event.target.setAttribute('unit-x', unitsX);
      event.target.setAttribute('unit-y', unitsY);
      event.target.childNodes[1].innerHTML = compileTimeText(unitsY, duration);
    }
    occupy(unitsX, unitsY, duration);
    currentElement = null;
  }
}).resizable({
  // resize from all edges and corners
  edges: { left: false, right: false, bottom: true, top: false },

  // keep the edges inside the parent
  restrictEdges: {
    outer: 'parent',
    endOnly: true,
  },

  snapSize:{
    targets:[
      function (x, y){
        let units = Math.floor((y+1)/timeUnit);
        if( (y+1) % timeUnit > timeUnit * 0.6){
          units += 1;
        }
        if(units < 1){
          units = 1;
        }
        if(currentElement != null){
          let unitsX = currentElement.getAttribute('unit-x');
          let unitsY = currentElement.getAttribute('unit-y');
          console.log(unitsX, unitsY, units)
          console.log(timeSlots)
          if(isOccupied(unitsX, unitsY, units)){
            //snap back
            let duration = currentElement.getAttribute('duration');
            units = Math.floor(duration / 60 / unitInterval);
            if( (duration /60 ) % timeUnit > timeUnit * 0.6){
              units += 1;
            }
            if(units < 1){
              units = 1;
            }
          }
        }
        return {y: units * timeUnit - 1 };
      }
    ],
    range: Infinity,
    endOnly: true, // soft snapping
  },
  inertia: true,
  onstart: interactStart,
  onend: function(event){
    console.log('end');
    let height = parseInt(currentElement.style.height);
    let duration = Math.round((height + 1 )/ timeUnit) * unitInterval * 60;
    let prevoiusDuration = event.target.getAttribute('duration');
    let unitsX = event.target.getAttribute('unit-x');
    let unitsY = event.target.getAttribute('unit-y');
    if(duration == prevoiusDuration){
      // snpped back
    } else {
      currentElement.setAttribute('duration', duration);
      event.target.childNodes[1].innerHTML = compileTimeText(unitsY, duration);
    }
    occupy(unitsX, unitsY, duration);
    currentElement = null;
  }
}).on('resizemove', function (event) {
  event.target.style.height = event.rect.height + 'px';
});


function scrollListener(event){
  if(currentElement == null){
    
    // console.log("scrolled", scrollElement.scrollTop, scrollElement.scrollLeft);
  } else {
    // console.log("scrolled");
    let target = currentElement,
      // keep the dragged position in the data-x/data-y attributes
      x = (parseFloat(target.getAttribute('data-x')) || 0) + scrollElement.scrollLeft - previousScroll.left,
      y = (parseFloat(target.getAttribute('data-y')) || 0) + scrollElement.scrollTop - previousScroll.top;

    // translate the element
    target.style.webkitTransform =
    target.style.transform =
      'translate(' + x + 'px, ' + y + 'px)';

    // update the posiion attributes
    target.setAttribute('data-x', x);
    target.setAttribute('data-y', y);

  }
  previousScroll.left = scrollElement.scrollLeft;
  previousScroll.top = scrollElement.scrollTop;
  dateElement.scrollLeft = scrollElement.scrollLeft;
}

  
function interactStart(event){
  console.log('start');
  currentElement = event.target;
  let unitsX = event.target.getAttribute('unit-x');
  let unitsY = event.target.getAttribute('unit-y');
  let duration = event.target.getAttribute('duration');
  vacate(unitsX, unitsY, duration);
}

// window.addEventListener("scroll", scrollListener);

function dragMoveListener (event) {
  let target = event.target,
      // keep the dragged position in the data-x/data-y attributes
      x = (parseFloat(target.getAttribute('data-x')) || 0) + event.dx,
      y = (parseFloat(target.getAttribute('data-y')) || 0) + event.dy;
      // console.log(event.dx,event.dy);

  // translate the element
  target.style.webkitTransform =
  target.style.transform =
    'translate(' + x + 'px, ' + y + 'px)';

  // update the posiion attributes
  target.setAttribute('data-x', x);
  target.setAttribute('data-y', y);
}

// this is used later in the resizing and gesture demos
window.dragMoveListener = dragMoveListener;

interact('.timeColumn').dropzone({
  // only accept elements matching this CSS selector
  accept: '.draggable',
  // Require a 51% element overlap for a drop to be possible
  overlap: 0.51,

  // listen for drop related events:

  ondropactivate: function (event) {
    // add active dropzone feedback
    event.target.classList.add('drop-active');
  },
  ondragenter: function (event) {
    var draggableElement = event.relatedTarget,
        dropzoneElement = event.target;

    // feedback the possibility of a drop
    dropzoneElement.classList.add('drop-target');
    // draggableElement.textContent = 'Dragged in';
  },
  ondragleave: function (event) {
    // remove the drop feedback style
    event.target.classList.remove('drop-target');
    // event.relatedTarget.textContent = 'Dragged out';
  },
  ondrop: function (event) {
    // event.target.appendChild(event.relatedTarget)
    // event.relatedTarget.textContent = 'Dropped';
  },
  ondropdeactivate: function (event) {
    // remove active dropzone feedback
    event.target.classList.remove('drop-target');
  }
});

window.onresize = function(event) {
  let events = document.getElementsByClassName("event");
  let origin = document.getElementById("originPoint");
  let position = origin.getBoundingClientRect();
  // console.log(events)
  for(let i = 0; i< events.length; i++){
    let unitsX = events[i].getAttribute('unit-x') || 0;
    if(unitsX == 0){
      continue;
    }
    let y = parseFloat(events[i].getAttribute('data-y'));
    let x = unitsX * position.width;

    // translate the element
    events[i].style.webkitTransform =
    events[i].style.transform =
      'translate(' + x + 'px, ' + y + 'px)';

    // update the posiion attributes
    events[i].setAttribute('data-x', x);
    events[i].setAttribute('data-y', y);
  }
    
  // console.log(events);
};


document.addEventListener('keypress', (event) => {
  if(event.code == 'Digit0'){
    createEventNode(data.events[0]);
  }
  if(event.code == 'Digit9'){
    removeEvent(document.getElementById('1'));
  }
});

function indexOfVenue(id){
  return 0;
}
function createEventNode(event){
  if(lastDay.getTime() <= event.start*1000 || firstDay.getTime() > event.start * 1000){
    console.log('not in this week', lastDay.getTime(), event.start*1000, firstDay.getTime());
    return;
  }
  let newEvent = document.createElement('div');
  newEvent.classList.add('draggable');
  newEvent.classList.add('event');
  let team = document.createElement('span');
  team.innerHTML = event.title;
  team.classList.add('eventText');
  newEvent.appendChild(team);
  let coordinates = timeToCoordinates(new Date(event.start*1000));
  if(isOccupied(coordinates.unitsX, coordinates.unitsY, event.duration / 60 / unitInterval)){
    alert('target time period is checked');
    return;
  }

  let timeSpan = document.createElement('span');
  timeSpan.innerHTML = compileTimeText(coordinates.unitsY, event.duration);
  timeSpan.classList.add('eventText')
  newEvent.appendChild(timeSpan);
  
  // console.log(coordinates)
  let height = Math.floor(event.duration * timeUnit / 60 / unitInterval) - 1;
  if(height < 1){
    height = 1;
  }
  let position = originElement.getBoundingClientRect();
  // translate the element
  let x = coordinates.unitsX * position.width;
  let y = coordinates.unitsY * timeUnit;
  newEvent.style.height = height + 'px';
  newEvent.style.webkitTransform =
  newEvent.style.transform =
    'translate(' + x + 'px, ' + y + 'px)';

  // update the posiion attributes
  newEvent.setAttribute('data-x', x);
  newEvent.setAttribute('data-y', y);
  
  newEvent.setAttribute('duration', event.duration);
  newEvent.setAttribute('id', event.id);
  newEvent.setAttribute('unit-x', coordinates.unitsX);
  newEvent.setAttribute('unit-y', coordinates.unitsY);
  originElement.appendChild(newEvent);
  occupy(coordinates.unitsX, coordinates.unitsY, event.duration);
  return newEvent;
}

function removeEvent(event){
  let unitsX = event.getAttribute('unit-x');
  let unitsY = event.getAttribute('unit-y');
  let duration = event.getAttribute('duration');
  vacate(unitsX, unitsY, duration);
  originElement.removeChild(event);
}

function timeToCoordinates(time){
  let difference = time.getTime() - firstDay.getTime();
  let unitsX = Math.floor(difference / (1000*3600*24)) * numberOfVenues + indexOfVenue(0);
  let unitsY = Math.floor((difference % (1000*3600*24)) / (1000 * 60 * unitInterval));
  return {unitsX, unitsY}
} 

function compileTimeText(unitsY, duration){
  let additionalMinutes = Math.floor(duration / 60);
  let startHours = muniteToAMPMClock(unitsY * unitInterval);
  let endHours = muniteToAMPMClock(unitsY * unitInterval + additionalMinutes);
  return startHours + ' - ' + endHours;
}

function muniteToAMPMClock(minutes){
  let hour = Math.floor(minutes / 60);
  let minute = ('0' + (minutes % 60)).slice(-2);
  return hour > 12 ? `${hour - 12}:${minute}PM` : hour == 12 ? `${hour}:${minute}PM`:`${hour}:${minute}AM`;
}

function initializeTimeSlots(){
  for(let i = 0; i < numberOfColumns; i++){
    timeSlots.push(Array(24*60/unitInterval).fill(0));
  }
}

function dyanamicallyInitializeDateColumn(){
  let time = new Date(firstDay);
  let columnContainer = document.getElementById('columnContainer');
  let scrollSpacer = document.getElementById('scrollSpacer');
  let eventArea = originElement.parentNode;
  console.log('fired',numberOfDays,numberOfVenues);
  for(let i = 0; i < numberOfDays; i++){
    for(let j = 0; j < numberOfVenues; j++){
      let column = document.createElement('div');
      column.classList.add('dateColumn');
      columnContainer.insertBefore(column, scrollSpacer);
      let date = document.createElement('span');
      let day = document.createElement('span');
      let venue = document.createElement('span');
      date.innerHTML = time.getDate();
      date.classList.add('dateText');
      day.innerHTML = weekdays[time.getDay()];
      day.classList.add('dayText');
      venue.innerHTML = config.venues[j].name;
      venue.classList.add('dayText');
      column.appendChild(date);
      column.appendChild(day);
      column.appendChild(venue);

      if(i != 0 || j !=0){
        let eventColumn = document.createElement('div');
        eventColumn.classList.add('timeColumn');
        eventArea.appendChild(eventColumn);
      }
    }
    time.setDate(time.getDate() + 1);
  }
}



function isOccupied(unitsX, unitsY, units){
  console.log(unitsX, unitsY, units)
  for(let i = unitsY; i < +unitsY + units; i++){
    if(i < timeSlots[unitsX].length){
      console.log(timeSlots[unitsX][i])
      if(timeSlots[unitsX][i] == 1){
        return true;
      }
    }
  }
  return false;
}

function occupy(unitsX, unitsY, duration){
  let numberOfSlots = Math.ceil(duration / 60 / unitInterval);
  // console.log("number of slots",numberOfSlots, unitsY)
  for(let i = unitsY; i < +unitsY + numberOfSlots; i++){
    // console.log(i, +unitsY + numberOfSlots);
    if(i < timeSlots[unitsX].length){
      timeSlots[unitsX][i] = 1;
    }
  }
}

function vacate(unitsX, unitsY, duration){
  let numberOfSlots = Math.ceil(duration / 60 / unitInterval);
  for(let i = +unitsY; i < (+unitsY + numberOfSlots); i++){
    if(i < timeSlots[unitsX].length){
      timeSlots[unitsX][i] = 0;
    }
  }
}

function initializeTimeArea(){
  let gridContainer = document.getElementById('gridContainer');
  let timeContainer = document.getElementById('timeContainer');
  let numberOfUnits = 24 * 60 / unitInterval;
  for(let i = 0; i < numberOfUnits; i++ ){
    let timeUnit = document.createElement('div');
    timeUnit.classList.add('timeUnit');
    let unitBlock = document.createElement('span');
    unitBlock.classList.add('unitBlock');
    unitBlock.innerHTML = muniteToAMPMClock(24*60*i/numberOfUnits);
    timeUnit.appendChild(unitBlock);
    timeContainer.appendChild(timeUnit);

    let gridRow = document.createElement('div');
    gridRow.classList.add('grid-row');
    gridContainer.appendChild(gridRow);
  }
}


function updateDatabase(){
  console.log('update database');
}