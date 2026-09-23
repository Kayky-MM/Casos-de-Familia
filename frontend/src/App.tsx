import '@xyflow/react/dist/style.css';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppPage } from './page/AppPage';
import { HomePage } from './page/HomePage';
import { Setup } from './page/Setup';


export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path='/' element={<HomePage/>}/>
        <Route path='/setup' element={<Setup/>}/>
        <Route path='/tree/:personId' element={<AppPage/>} />
      </Routes>
    </BrowserRouter>
  );
}