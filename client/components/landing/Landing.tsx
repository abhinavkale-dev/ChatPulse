"use client"

import Hero from './Hero'
import PreLoader from './Preloader';

function Landing() {
  return (
    <>
    <PreLoader/>
    <div>
      <Hero />
    </div>
    </>
  )
}

export default Landing