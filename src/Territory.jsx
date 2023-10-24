import React, { useRef, useState } from 'react'
import './index.css'

function getPlusOrMinus(val){
    return val >= 0 ? "+" : "-";
  }

function Territory (props) {

    let _alignment = props.alignment;

    if (_alignment == "nos"){
        _alignment = "nosferatu";
    } else if (_alignment == "carthians"){
        _alignment = "carthian";
    } else if (_alignment == "circle"){
        _alignment = "crone";
    } else if (_alignment == "ordo dracul"){
        _alignment = "ordo";
    } else if (_alignment == "lancea"){
        _alignment = "lance";
    }

    let _holder = props.holder;

    if (_holder == "NONE"){
        _holder = null;
    }

    let [name] = useState(props.name);
    let [alignment] = useState(_alignment);
    let [holder] = useState(_holder);
    let [emPosX] = useState(props.emPosX);
    let [emPosY] = useState(props.emPosY);
    let [id] = useState(props.name.toLowerCase().replaceAll(" ","-"));
    let [week] = useState(props.week);
    let [territoryLabelFontSize] = useState(props.territoryLabelFontSize)

    const myRef = useRef(null);
    props.t.ref = myRef;

    return (
    <>
     <div ref={myRef} className={"territory "+ alignment} id={id}
     style={{left:"calc(0% "+getPlusOrMinus(emPosX) + " " + Math.abs(emPosX)+"em)",
     top:"calc(0% "+getPlusOrMinus(emPosY) + " " + Math.abs(emPosY)+"em)",
     opacity:props.fadedOut ? 0.025 : 1}}>
        <div className="territoryText" style={{whiteSpace:"nowrap",fontSize:territoryLabelFontSize}}>
            {name}
        </div>
        {holder != null ? 
            <div className="territoryText" style={{fontSize:territoryLabelFontSize}}>
                {"("+holder+")"}
            </div> : null}
    </div>
    </>
  )
}

export default Territory