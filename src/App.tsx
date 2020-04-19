import React from 'react'
import './App.css'

import {
  BrowserRouter as Router,
  Switch,
  Route,
  Redirect,
} from 'react-router-dom'

import { Lobby } from './lobby/Lobby'
import { Exercises } from './track/Exercises'
import { PlayExercise } from './play/PlayExercise'

export default function App() {
  return (
    <Router>
      <Switch>
        <Route path="/about">
          <About />
        </Route>
        <Route path="/:track/exercises" component={Exercises} />
        <Route path="/:track/play/:type/:slug" component={PlayExercise} />
        <Route path="/" exact>
          <Lobby />
        </Route>
        <Redirect to="/" />
      </Switch>
    </Router>
  )
}

function About() {
  return <h2>About</h2>
}
