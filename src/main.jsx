import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import Wrapped from './Wrapped.jsx'
import './index.css'

let USE_WRAPPED = false;

if (window.location.hash.includes("#wrapped")){
  USE_WRAPPED = true;
}

let app = <App USE_WRAPPED={USE_WRAPPED}/>;
let wrapped = <Wrapped/>

const root = ReactDOM.createRoot(document.getElementById('root'));

document.getElementById('root').style = USE_WRAPPED ? "overflow-y:auto" : "";

root.render(
  <React.StrictMode>
    {USE_WRAPPED ? wrapped : <></>}
    {app}
  </React.StrictMode>
)