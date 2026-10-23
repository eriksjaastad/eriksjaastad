import React from 'react';
import {
  BrowserRouter as Router,
  Switch,
  Route,
} from "react-router-dom";
import Azcend from './Azcend/Azcend';
import Home from './Home/Home';

export default function App() {
  return (
    <Router>
      <Switch>
        <Route path="/azcend">
          <Azcend />
        </Route>
        <Route path="/">
          <Home />
        </Route>
      </Switch>
    </Router>
  );
}
