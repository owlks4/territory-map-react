import React, { useState } from 'react'
import './index.css'
import Territory from './Territory.jsx';

class Adjacency {
  constructor(x1,y1,x2,y2,a1){
      this.x1 = x1;
      this.y1 = y1;
      this.x2 = x2;
      this.y2 = y2;
      this.a1 = a1;
  }
}

class Week {
  constructor(year,week,title){
    this.year=year;
    this.week=week;
    this.title=title;
  }
}

class App extends React.Component {

  constructor(props){
    super(props);
    this.state = {
      territories: [],
      adjacencies: [],
      year: 6,
      week: 3,
      territoryLabelFontSize: "1em",
      weekTitle: "",
      dragging: false,
      displayTop: 0,
      displayLeft: -225,
      mapAdjustLeft: "54%",
      mapAdjustTop: "40%",
      touchStartX: 0,
      touchStartY: 0,
      fontSizeEm: 0.89,
      loadedWeeks: []
    }
  }

  onMouseMove(event) {
    
    if (this.state.dragging){
        this.setState({displayLeft: this.state.displayLeft + event.movementX,
                       displayTop: this.state.displayTop + event.movementY,
                      territories: this.state.territories});
      //  app.updateCanvasPosition();
    }
  }

  onTouchMove(event) {
    if (this.state.dragging){
        let touch = event.touches[0];
        this.setState({displayLeft: this.state.displayLeft + (touch.clientX - this.state.touchStartX),
                       displayTop:  this.state.displayTop + (touch.clientY - this.state.touchStartY),
                       touchStartX: touch.clientX,
                       touchStartY: touch.clientY});
       // app.updateCanvasPosition();
    }
  }

  componentDidMount(){
    document.addEventListener('mousedown', () => {this.setState({dragging: true})});
    document.addEventListener("mousemove", (event) => {this.onMouseMove(event)});
    document.addEventListener("mouseup", () => {this.setState({dragging: false})});
    document.addEventListener("wheel", (ev) => {let change = ev.deltaY/1000; (this.state.fontSizeEm - change > 0.5) && (this.state.fontSizeEm - change < 3) ? this.setState({fontSizeEm: this.state.fontSizeEm - change}) : null; /*app.updateCanvasPosition()*/});
    document.addEventListener("touchmove", this.onTouchMove);
    document.addEventListener("touchstart", ev => {this.setState({dragging: true}); let touch = ev.touches[0]; this.setState({touchStartX: touch.clientX, touchStartY: touch.clientY});});
    document.addEventListener("touchend",() => {this.setState({dragging: false});});

    this.changeYear(6);
    this.changeWeek(3);
  }

  changeYear(newYearNumber){

    let newLoadedWeeks = [];

    for (let i = 1; i < 30; i++){
      fetch("./csv/y"+newYearNumber+"/territoryAssignments-wk"+i+".csv")
      .then(response => response.text())
      .then(text => {
        if (text != ""){
          let lines = text.split("\n");
          newLoadedWeeks.push({title: "Week "+i+" - "+lines[0], weekNumber:i});
        }
      });
    }

    this.setState({year:newYearNumber, week:1, loadedWeeks:newLoadedWeeks});
  }

  changeWeek(newWeekNumber){    
    this.setState({week:newWeekNumber});
    this.getTerritoriesFromCSV(this.state.year,newWeekNumber);
    this.forceUpdate();
    alert("When clicking the appropriate button on the right panel, this should update the territories to be of their state in that week - but for some reason, the DOM doesn't reflect the change when you press the button, even though it's the exact same that activates successfully on page load.");
    alert("...is it because I'm making an array of react elements when the territory array is generated? Would it be better to store them as objects, then make the components in the render() method - and then it might actually display them?");
  }

  getTerritoriesFromCSV(year,week){
      fetch("./csv/y"+year+"/territoryAssignments-wk"+week+".csv")
      .then(response => response.text())
      .then(text => {
      console.log(text);
      let lines = text.split("\n");
  
      this.setState ({ weekTitle: lines[0],
                      territoryLabelFontSize: lines[1].trim()});
      
      console.log("Week "+week+": "+ lines[0]);
  
      let territoriesTemp = [];
      
      for (let i = 3; i < lines.length; i++){
          let splitLine = lines[i].split(",");
          if (splitLine[0].trim() == "ADJACENCY"){
            this.state.adjacencies.push(
                  new Adjacency(
                      splitLine[1].trim(),
                      splitLine[2].trim(),
                      splitLine[3].trim(),
                      splitLine[4].trim(),
                      splitLine[5].trim()));
          } else {
            territoriesTemp.push(<Territory name={splitLine[0].trim()} alignment={splitLine[1].trim().toLowerCase()} holder={splitLine[2].trim()} emPosX={splitLine[3].trim()} emPosY={splitLine[4].trim()} week={week}/>);
          }
      }
      this.setState({territories:territoriesTemp});
    });
    }
  
  render(){
    let territoriesForDisplay = this.state.territories.map((territory) => <>{territory}</>);
    console.log(territoriesForDisplay);
    return (
    <>
        {this.state.canvas}        
        <h1>
            Territory Map
        </h1>
        <div id="display" style={{position:'absolute',left:"calc("+this.state.mapAdjustLeft+" + "+this.state.displayLeft+"px)",
            top:"calc("+this.state.mapAdjustTop+" + "+this.state.displayTop+"px)",fontSize:this.state.fontSizeEm+"em"}}>
            <div id="territories" style={{position:'absolute', left:this.state.mapAdjustLeft, top:this.state.mapAdjustTop}}>
              {territoriesForDisplay}
            </div>
          <>{this.state.displayLeft}</>
        </div>
        <div id="panel">
            <br/>
            <hr/>
            <h2>Map display options</h2>
            <hr/>
            <br/>
            <div className="weeksScroll">
              <>{this.state.loadedWeeks.map((week) => <><h4 className="weekOption" onClick={() => this.state.week != week.weekNumber ? this.changeWeek(week.weekNumber) : null}>{week.title}</h4></>)}</>
            </div>
        </div>
    </>
  )}
}

export default App
