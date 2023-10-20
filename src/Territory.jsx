import React, { useState } from 'react'
import './index.css'

class Territory extends React.Component {

  constructor(props){
    super(props);

    let alignment = props.alignment;

    if (alignment == "nos"){
        alignment = "nosferatu";
    } else if (alignment == "carthians"){
        alignment = "carthian";
    } else if (alignment == "circle"){
        alignment = "crone";
    } else if (alignment == "ordo dracul"){
        alignment = "ordo";
    } else if (alignment == "lancea"){
        alignment = "lance";
    }

    let holder = props.holder;

    if (holder == "NONE"){
        holder = null;
    }

    this.state = {
        name: props.name,
        alignment: alignment,
        holder: holder,
        emPosX: props.emPosX,
        emPosY: props.emPosY,
        id: props.name.toLowerCase().replaceAll(" ","-"),
        week: props.week
    }
  }

  getPlusOrMinus(val){
    return val >= 0 ? "+" : "-";
  }

  render(){
    return (
    <>
     <div className={"territory "+ this.state.alignment} id={this.state.id+"-"+this.state.week} style={{left:"calc(0% "+this.getPlusOrMinus(this.state.emPosX) + " " + Math.abs(this.state.emPosX)+"em)",top:"calc(0% "+this.getPlusOrMinus(this.state.emPosY) + " " + Math.abs(this.state.emPosY)+"em)"}}>
        <div className="territoryText" style={{whiteSpace:"nowrap",fontSize:this.state.territoryLabelFontSize}}>
            {this.state.name}
        </div>
        {this.state.holder != null ? 
            <div className="territoryText" style={{fontSize:this.state.territoryLabelFontSize}}>
                {"("+this.state.holder+")"}
            </div> : null}
    </div>
    </>
  )}
}

export default Territory