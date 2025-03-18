"use client"

import React, { useState } from 'react'
import Hero from './Hero'
import { AnimatePresence } from 'framer-motion'
// import PreLoader from './Preloader';

function Landing() {
  return (
    <>
    {/* <PreLoader/> */}
    <div>
      <Hero />
    </div>
    </>
  )
}

export default Landing