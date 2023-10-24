import React, { useRef, useState } from 'react'
import './index.css'

function LegendElement (props) {

return (<div className={"territory "+props.alignment.toLowerCase()+" inline-territory"}
            onMouseEnter={() => {props.setHighlightedCategory(props.alignment.toLowerCase(),props.app)}}>
            {props.alignment}  
        </div>);
}

export default LegendElement