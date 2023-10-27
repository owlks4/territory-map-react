import { useState } from 'react'
import './index.css'

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
    } else if (_alignment == "vics"){
        _alignment = "invictus";
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
    let [posX] = useState(props.posX);
    let [posY] = useState(props.posY);
    let [id] = useState(props.name.toLowerCase().replaceAll(" ","-"));
    let [week] = useState(props.week);
    let [territoryLabelFontSize] = useState(props.territoryLabelFontSize)
    let [mouseOver, setMouseOver] = useState(false);

    return (
    <>
     <div className={"territory "+ alignment} id={id} onMouseEnter={() => {setMouseOver(true)}} onMouseLeave={() => {setMouseOver(false)}}
     style={{left:posX, top:posY, zIndex: (mouseOver ? 2 : 1), opacity:props.fadedOut ? 0.025 : 1}}>
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