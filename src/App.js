import React from 'react';
import {
  BrowserRouter as Router,
  Switch,
  Route,
} from "react-router-dom";
import Azcend from './Azcend/Azcend';
import Resume from './Resume/Resume';

export default function App() {
  return (
    <Router>
      <Switch>
        <Route path="/azcend">
          <Azcend />
        </Route>
        <Route path="/">
          <Resume />
        </Route>
      </Switch>
    </Router>
  );
}
