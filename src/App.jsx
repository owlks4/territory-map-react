import React, { useState } from 'react'
import './index.css'
import Territory from './Territory.jsx';
import LegendElement from './legendElement.jsx';

const DEFAULT_YEAR = 6;
const DEFAULT_WEEK = 1;
const SHOW_DEBUG_COORDS_IN_CENTRE = false;
const MAX_SPECULATIVE_CSV_CHECK_NUMBER = 30;  //as in, in any given year, it will look for this many CSVs in the given folder. It's unlikely to ever be that many, but that's the upper bound here.

let isReady = false;
let mouseIsOverPanel = false;
let canvas = null;
let hasDrawnToCanvasForFirstTime = false;

class Adjacency {
  constructor(week,x1,y1,x2,y2,sideOrTop1, sideOrTop2){
      this.week = week;
      this.x1 = parseFloat(x1);
      this.y1 = parseFloat(y1);
      this.x2 = parseFloat(x2);
      this.y2 = parseFloat(y2);

      if (sideOrTop1 == "side"){
        this.a1 = (this.x1 + this.x2) / 2
        this.b1 = parseFloat(y1);
      } else {
        this.a1 =  parseFloat(x1);
        this.b1 = (this.y1 + this.y2) / 2;
      }

      if (sideOrTop2 == "side"){
        this.a2 = (this.x1 + this.x2) / 2
        this.b2 = parseFloat(y2);
      } else {
        this.a2 =  parseFloat(x2);
        this.b2 = (this.y1 + this.y2) / 2;
      }
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
      loadedWeeks: [],
      weekBounds: [],
      highlightedCategory: null
    }
  }

  onMouseMove(event) {
    
    if (this.state.dragging && isReady){
      this.tryInitialiseCanvas();
      this.setState({displayLeft: this.state.displayLeft + event.movementX,
                       displayTop: this.state.displayTop + event.movementY,
                      territories: this.state.territories});
    }
  }

  tryInitialiseCanvas(){
    if (!hasDrawnToCanvasForFirstTime){
      canvas = document.getElementById("canvas");
       if (canvas != null){
          this.redrawCanvasAccordingToWeek(this.state.week);
          }
        }
  }

  componentDidMount(){
    document.addEventListener('mousedown', () => {this.setState({dragging: true && !mouseIsOverPanel})});
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
          let lines = text.trim().split("\n");
          newLoadedWeeks.push({title: "Week "+i+" - "+lines[0], weekNumber:i, minX:null, maxX:null, minY:null, maxY:null});
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

    this.tryInitialiseCanvas();  
  }

  changeWeek(newWeekNumber){    
    this.setState({week:newWeekNumber});
    this.redrawCanvasAccordingToWeek(newWeekNumber);
  }

  redrawCanvasAccordingToWeek(week){
    if (canvas == null){
      return;
    }

    let ctx = canvas.getContext("2d");
    ctx.imageSmoothingEnabled = true;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = "#505050";
    ctx.lineWidth = 1.5;

    for (let i = 0; i < this.state.adjacencies.length; i++){
      hasDrawnToCanvasForFirstTime = true;
      let a = this.state.adjacencies[i];
      if (a.week != week){
          continue;
        }
      ctx.beginPath();        
      ctx.moveTo((a.x1/100) * canvas.width, (a.y1/100) * canvas.height);
      ctx.bezierCurveTo((a.a1/100) * canvas.width, (a.b1/100) * canvas.height,
                        (a.a2/100) * canvas.width, (a.b2/100) * canvas.height, 
                        (a.x2/100) * canvas.width, (a.y2/100) * canvas.height);
      ctx.stroke();
    }
  }

  getTerritoriesFromCSV(lines, week){

    let line1Split = lines[1].split(",");

      this.setState ({ weekTitle: lines[0],
                      territoryLabelFontSize: line1Split[0].trim()
                    });
      
      this.state.weekBounds.push({
        week: week,
        minX: parseFloat(line1Split[1].trim()),
        maxX: parseFloat(line1Split[2].trim()),
        minY: parseFloat(line1Split[3].trim()),
        maxY: parseFloat(line1Split[4].trim())});

      for (let i = 3; i < lines.length; i++){
          let splitLine = lines[i].replaceAll("%","").split(",");
          if (splitLine[0].trim().includes("ADJ")){
            this.state.adjacencies.push(
                  new Adjacency(
                      week,
                      splitLine[1].trim(),
                      splitLine[2].trim(),
                      splitLine[3].trim(),
                      splitLine[4].trim(),
                      splitLine[5].trim(),
                      splitLine[6].trim()));
          } else {
              let t = {
                name:splitLine[0].trim(),
                alignment:splitLine[1].trim().toLowerCase(),
                holder:splitLine[2].trim(),
                emPosX:splitLine[3].trim(),
                emPosY:splitLine[4].trim(),
                week:week,
                ref:null
              }

              this.state.territories.push(t);
            }
        }
    }
  
  getTerritoryByName(name){
    for (let i = 0; i < this.state.territories.length; i++){
      if (this.state.territories[i].name == name){
        return this.state.territories[i];
      }
    }
    return null;
  }

  getCurrentWeekBounds(week){

    for(let i = 0; i < this.state.weekBounds.length; i++){
      if (this.state.weekBounds[i].week == week){
        return this.state.weekBounds[i];
      }
    }

    return null;
  }

  setHighlightedCategory(newValue,app){
    app.setState({highlightedCategory:newValue}); //'app' is basically synonymous with 'this', but because this function is called from another element, the 'app' reference has to be used instead, because otherwise, it would misinterpret the 'this'.
  }

  render(){

    let currentWeekBounds = this.getCurrentWeekBounds(this.state.week);

    this.tryInitialiseCanvas();

    return (
    <>
        <h1 className="hideOnMobile">
            Territory Map History
        </h1>
        <h1 style={{marginTop: "2em", position:"absolute", top:"35%", textAlign:"center", width:"100%", display:"inherit", zIndex:"0"}}>
            {isReady ? null : (window.innerWidth < 1000 ? "I strongly suggest you view this on PC instead." : "LOADING...")}
        </h1>
        <div id="displayParent">
          <div id="display" style={{position:'absolute',left:"calc("+this.state.mapAdjustLeft+" + "+this.state.displayLeft+"px)",
              top:"calc("+this.state.mapAdjustTop+" + "+this.state.displayTop+"px)",fontSize:this.state.fontSizeEm+"em"}}>
              <div id="territories" style={{position:'absolute', left:this.state.mapAdjustLeft, top:this.state.mapAdjustTop}}>
                {this.state.territories.map((t) => t.week == this.state.week ? (<><Territory fadedOut={this.state.highlightedCategory == null ? false : (this.state.highlightedCategory != t.alignment)} t={t} name={t.name} alignment={t.alignment} holder={t.holder} emPosX={t.emPosX} emPosY={t.emPosY} week={t.week} territoryLabelFontSize={this.state.territoryLabelFontSize}/></>) : null)}
              </div>
              <>{SHOW_DEBUG_COORDS_IN_CENTRE ? this.state.displayLeft + " " + this.state.displayTop : null}</>
              {
                currentWeekBounds != null
                ?
                <canvas id="canvas" width="1920" height="1080" style={{position:'absolute', left:currentWeekBounds.minX+"em",
                                           top:currentWeekBounds.minY+"em",                         
                                           width:(currentWeekBounds.maxX - currentWeekBounds.minX)+"em",
                                           height:(currentWeekBounds.maxY - currentWeekBounds.minY)+"em"}}></canvas>
                : null                
              }
          </div>
        </div>
        <p className="hideOnMobile" style={{color:"rgb(180,180,180)", margin: "2em 0 2em 6em", width: "100%", bottom:0, position:"absolute"}}>
          Disclaimer: This is unofficial, and for comparing changes from past weeks - it's definitely not live!
        </p>
        <div id="panel" className="hideOnMobile" onMouseEnter={() => {mouseIsOverPanel = true;}} onMouseLeave={() => {mouseIsOverPanel = false;}}>
            <br/>
            <br/>
            <h2>Legend</h2>
            <hr/>
            <div id="key">
              <div onMouseLeave={() => {this.setHighlightedCategory(null,this)}}>
                <div>
                  <LegendElement alignment="Ventrue" app={this} setHighlightedCategory={this.setHighlightedCategory}/>
                  <LegendElement alignment="Daeva" app={this} setHighlightedCategory={this.setHighlightedCategory}/>
                  <LegendElement alignment="Mekhet" app={this} setHighlightedCategory={this.setHighlightedCategory}/>
                  <LegendElement alignment="Gangrel" app={this} setHighlightedCategory={this.setHighlightedCategory}/>
                  <LegendElement alignment="Nos" app={this} setHighlightedCategory={this.setHighlightedCategory}/>
                </div>
                <div style={{marginTop:"0.25em"}}>
                  <LegendElement alignment="Invictus" app={this} setHighlightedCategory={this.setHighlightedCategory}/>
                  <LegendElement alignment="Carthian" app={this} setHighlightedCategory={this.setHighlightedCategory}/>
                  <LegendElement alignment="Lance" app={this} setHighlightedCategory={this.setHighlightedCategory}/>
                  <LegendElement alignment="Crone" app={this} setHighlightedCategory={this.setHighlightedCategory}/>
                  <LegendElement alignment="Ordo" app={this} setHighlightedCategory={this.setHighlightedCategory}/>
                </div>
              </div>
              <div style={{marginTop:"0.5em"}} onMouseLeave={() => {this.setHighlightedCategory(null,this)}}>
                <LegendElement alignment="Court" app={this} setHighlightedCategory={this.setHighlightedCategory}/>
                <LegendElement alignment="Personal" app={this} setHighlightedCategory={this.setHighlightedCategory}/>
                <LegendElement alignment="Enemy" app={this} setHighlightedCategory={this.setHighlightedCategory}/>
                <LegendElement alignment="Unclaimed" app={this} setHighlightedCategory={this.setHighlightedCategory}/>
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
