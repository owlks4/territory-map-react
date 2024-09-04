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

    let canvas = <canvas ref={canvasRef} id="chart-js-canvas" width={screen.orientation.type.includes("portrait") ? 512 : window.innerWidth/2}
    style={{backgroundColor:"white",margin:0,padding:0,border:0}} height={screen.orientation.type.includes("portrait") ? 512 : window.innerHeight/2}>
    </canvas>
    
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
                            itemSort: function(a, b) {
                                return a.dataset.label.split(" ").pop().localeCompare(b.dataset.label.split(" ").pop());
                              },
                            callbacks: {
                              title: (tooltipItems) => {
                                return "Week "+tooltipItems[0].label;
                              }
                            }
                          }
                    },
                    maintainAspectRatio:true,
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
                            ticks: {
                                precision: 0
                            }
                        }
                    }
                }
            }); 
        } else {
            console.log("will not create new chart (old one wasn't null, should have been set to null on closing the old chart overlay. This is probably fine though, as for some reason the creation function often calls twice. This notification was probably caused to appear by that redundant second call.)")
        }
      }, []);
    
    return <div id="veil" onClick={(e)=>{if (e.target.id=="veil"){destroy()}}}>
        <div id="line-graph-sizing">            
            {canvas}
        </div>
    </div>
  }

export default LineGraph