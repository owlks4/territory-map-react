import React, { useState } from 'react'
import './index.css'
import Territory from './Territory.jsx';

const DEFAULT_YEAR = 6;
const DEFAULT_WEEK = 1;
const SHOW_DEBUG_COORDS_IN_CENTRE = false;
const MAX_SPECULATIVE_CSV_CHECK_NUMBER = 30;  //as in, in any given year, it will look for this many CSVs in the given folder. It's unlikely to ever be that many, but that's the upper bound here.

let isReady = false;

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
      year: -1,
      week: -1,
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
    
    this.changeYear(DEFAULT_YEAR);
  }

  async changeYear(newYearNumber){

    if (this.state.year == newYearNumber){
      console.log("Did not attempt to change year, because that year was already selected.");
      return;
    }
    
    let newLoadedWeeks = [];
    let highestWeekFound = -1;

    for (let i = 1; i < MAX_SPECULATIVE_CSV_CHECK_NUMBER; i++){
      await fetch("./csv/y"+newYearNumber+"/territoryAssignments-wk"+i+".csv")
      .then(response => response.text())
      .then(text => {
        if (text != "" && text[0] != "<"){
          let lines = text.split("\n");
          newLoadedWeeks.push({title: "Week "+i+" - "+lines[0], weekNumber:i});
          this.getTerritoriesFromCSV(lines, i);
          if (i > highestWeekFound){
            highestWeekFound = i;
          }
        }
      });
    }
    newLoadedWeeks = newLoadedWeeks.sort((a, b) => a.weekNumber - b.weekNumber)          
    this.setState({year:newYearNumber, week: highestWeekFound, loadedWeeks:newLoadedWeeks});
    isReady = true;
  }

  changeWeek(newWeekNumber){    
    this.setState({week:newWeekNumber});
  }

  getTerritoriesFromCSV(lines, week){

      this.setState ({ weekTitle: lines[0],
                      territoryLabelFontSize: lines[1].trim()});
      
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
            this.state.territories.push({name:splitLine[0].trim(),
                                   alignment:splitLine[1].trim().toLowerCase(),
                                   holder:splitLine[2].trim(),
                                   emPosX:splitLine[3].trim(),
                                   emPosY:splitLine[4].trim(),
                                   week:week});
          }
        }
    }
  
  render(){
    return (
    <>
        {this.state.canvas}
        <h1 className="hideOnMobile">
            Territory Map History
        </h1>
        <h1 style={{marginTop: "2em", position:"absolute", top:"35%", textAlign:"center", width:"100%", display:"inherit", zIndex:"0"}}>
            {isReady ? null : "LOADING..."}
          </h1>
        <div id="displayParent">
          <div id="display" style={{position:'absolute',left:"calc("+this.state.mapAdjustLeft+" + "+this.state.displayLeft+"px)",
              top:"calc("+this.state.mapAdjustTop+" + "+this.state.displayTop+"px)",fontSize:this.state.fontSizeEm+"em"}}>
              <div id="territories" style={{position:'absolute', left:this.state.mapAdjustLeft, top:this.state.mapAdjustTop}}>
                {this.state.territories.map((t) => t.week == this.state.week ? (<><Territory name={t.name} alignment={t.alignment} holder={t.holder} emPosX={t.emPosX} emPosY={t.emPosY} week={t.week}/></>) : null)}
              </div>
            <>{SHOW_DEBUG_COORDS_IN_CENTRE ? this.state.displayLeft + " " + this.state.displayTop : null}</>
          </div>
        </div>
        <p className="hideOnMobile" style={{color:"rgb(180,180,180)", margin: "2em 0 2em 6em", width: "100%", bottom:0, position:"absolute"}}>
            Disclaimer: This is unofficial, and for comparing changes from past weeks - it's definitely not live!
          </p>
        <div id="panel" className="hideOnMobile">
            <br/>
            <br/>
            <h2>Legend</h2>
            <hr/>
            <div id="key">
              <div>
                <div className="territory ventrue inline-territory">Ventrue</div>
                <div className="territory daeva inline-territory">Daeva</div>
                <div className="territory mekhet inline-territory">Mekhet</div>
                <div className="territory gangrel inline-territory">Gangrel</div>
                <div className="territory nosferatu inline-territory">Nos</div>
              </div>
              <div style={{marginTop:"0.25em"}}>
                <div className="territory invictus inline-territory">Invictus</div>
                <div className="territory carthian inline-territory">Carthian</div>
                <div className="territory lance inline-territory">Lance</div>
                <div className="territory crone inline-territory">Crone</div>
                <div className="territory ordo inline-territory">Ordo</div>
              </div>
              <div style={{marginTop:"0.5em"}}>
                <div className="territory court inline-territory">Court</div>
                <div className="territory personal inline-territory">Personal</div>
                <div className="territory enemy inline-territory">Enemy</div>
                <div className="territory unclaimed inline-territory">Unclaimed</div>
              </div>
            </div>
            <br/>   
            <br/>
            <h2>Select past week</h2>
            <hr/>
            <div className="weeksScroll">
              <>{this.state.loadedWeeks.map((week) => <><h4 className={"weekOption"+ (week.weekNumber == this.state.week ? " selected" : "")} onClick={() => this.state.week != week.weekNumber ? this.changeWeek(week.weekNumber) : null}>{week.title}</h4></>)}</>
            </div>
        </div>
    </>
  )}
}

export default App
