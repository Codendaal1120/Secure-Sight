import * as api from './services/Api';
import './App.css'
import.meta.env

function App() {
 
  console.log(import.meta.env);
  const c = api.cameras();

  return (
    <h1>Hello</h1>
  )
}

export default App
