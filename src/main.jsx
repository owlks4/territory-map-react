import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import Wrapped from './Wrapped.jsx'
import './index.css'

const USE_WRAPPED = false;

let app = <App/>;
let wrapped = <Wrapped/>

const root = ReactDOM.createRoot(document.getElementById('root'));

document.getElementById('root').style = USE_WRAPPED ? "overflow-y:auto" : "";

root.render(
  <React.StrictMode>
    {USE_WRAPPED ? wrapped : <></>}
    {app}
  </React.StrictMode>
)