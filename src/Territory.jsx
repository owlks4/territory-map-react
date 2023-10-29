import { useState } from 'react'
import './index.css'

function Territory (props) {

    let _holder = props.holder;

    if (_holder == "NONE"){
        _holder = null;
    }

    let splitHolder = ("("+_holder+")").replaceAll("  "," ").split(" ");
    
    let holderSegments = [];
    let curSegment = "";
    let holderFullSegment = null;

    if (props.maxHolderLineLength > 0){
        for (let i = 0; i < splitHolder.length; i++){       //breaks up the holder name onto separate lines
            if (curSegment.length + splitHolder[i].length <= props.maxHolderLineLength){
                curSegment += splitHolder[i] + " ";
                if (i == splitHolder.length - 1){
                    holderSegments.push(<>{curSegment+""}</>);
                    holderSegments.push(<br/>);
                }
            }
            else {
                if (curSegment != ""){
                    holderSegments.push(<>{curSegment+""}</>);
                    holderSegments.push(<br/>);
                }
                curSegment = splitHolder[i] + " "; //this is the segment that we decided wouldn't fit on the end of this line, so it instead forms the basis for the next line.""
                if (i == splitHolder.length - 1){
                    holderSegments.push(<>{curSegment+""}</>);
                    holderSegments.push(<br/>);
                }
            }
        }
        holderFullSegment = <>{holderSegments.map((s) => s)}</>
    } else {
        holderFullSegment = <>{"("+_holder+")"}</>
    }

    let [id] = useState(props.name.toLowerCase().replaceAll(" ","-"));
    let [week] = useState(props.week);
    let [mouseOver, setMouseOver] = useState(false);

    return (
    <>
     <div className={"territory "+ props.alignment} id={id} onMouseEnter={() => {setMouseOver(true)}} onMouseLeave={() => {setMouseOver(false)}}
     style={{left:props.posX, top:props.posY, zIndex: (mouseOver ? 2 : 1), opacity:props.fadedOut ? 0.025 : 1}}>
        <div className="territoryText" style={{whiteSpace:"nowrap",fontSize:props.territoryLabelFontSize}}>
            {props.name}
        </div>
        {_holder != null ? 
            <div className="territoryText" style={{fontSize:props.territoryLabelFontSize}}>
                {holderFullSegment}
            </div> : null}
    </div>
    </>
  )
}

export default Territory