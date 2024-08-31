import { createRef, useEffect } from "react";
import Chart from 'chart.js/auto';

let chart = null;

let setLineGraph = null;

function destroy(){
    chart.destroy();
    chart = null;
    setLineGraph(null);
}

function LineGraph(props) {

    let canvasRef = createRef();

    let canvas = <canvas ref={canvasRef} id="chart-js-canvas" width={window.innerWidth/2} height={window.innerHeight/2} style={{backgroundColor:"white",margin:0,padding:0,border:0}}></canvas>
    
    setLineGraph = props.setLineGraph;

    useEffect(() => {
        if (chart == null){
            chart = new Chart(canvasRef.current.getContext("2d"), {
                type: 'line',
                data: props.stats,
                options: {                    
                    plugins: {
                        legend: {
                            display:props.displayLegend,
                            labels: {
                                usePointStyle: true,
                              }
                        },
                        title: {
                            display: true,
                            text: props.title,
                            font: {weight:"bold", size:"25px"}
                        },
                        tooltip: {
                            callbacks: {
                              title: (tooltipItems) => {
                                return "Week "+tooltipItems[0].label;
                              }
                            }
                          }
                    },
                    responsive: true,
                    scales: {
                        x: {
                            title: {
                                display:true,
                                text:"Week"
                            }
                        },
                        y: {
                            grace:1,
                            title: {
                                display:true,
                                text:"Number of territories owned"
                            },
                            beginAtZero: true,
                        }
                    }
                }
            }); 
        } else {
            console.log("will not create new chart (old one wasn't null, should have been set to null on closing the old chart overlay. This is probably fine though, as for some reason the creation function often calls twice.)")
        }
      }, []);
    
    return <div id="veil" onClick={(e)=>{if (e.target.id=="veil"){destroy()}}} style={{position:"absolute",width:"100vw",height:"100vh", display:"flex", justifyContent:"center",
                        alignItems:"center", top:0,backgroundColor:"rgba(0,0,0,0.5)", zIndex:1000}}>
        <div style={{width:"50%",height:"50%", backgroundColor:"white", border:"20px solid white", borderTop:"5px solid white"}}>            
            {canvas}
        </div>
    </div>
  }

export default LineGraph