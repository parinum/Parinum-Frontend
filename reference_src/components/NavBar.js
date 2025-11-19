// components/NavBar.js
import { useRouter } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import { initProvider } from '../lib/functions.js';

import PaysecIcon from '../icons/paysec';


function NavBar(props) {
  const [walletConnected, setWalletConnected] = useState(false);
  const router = useRouter();

  const connectWallet = async () => {
    try {
      await initProvider();
      setWalletConnected(true);
    } catch (error) {
      console.error("Failed to connect wallet", error);
    }
  };

  const navigateTo = (path) => {
    router.push(path);
  };

  return (
    <>
      <div className="navbar">
        <button className='homeButton' id='homeButton' onClick={() => navigateTo("/")}>
          <PaysecIcon id='homeButton paysec-icon' className='clickable-icon'/>
          <text id='paysec-text'>PaySec</text>
        </button>
        <div className='navbar-buttons'>
          <button onClick={() => navigateTo("/create-purchase")}>Purchases</button>
          <button onClick={() => navigateTo("/withdraw-dividend")}>Staking</button>
          <button onClick={() => window.open("https://github.com/PaySec-Finance/PaySec", "_blank")}>Explore</button>
          <button onClick={() => navigateTo("/funding-dashboard")}>PSC</button>
          {props.children}
        </div>
        <button id="connectWalletButton" onClick={connectWallet}>
          {walletConnected ? "Connected" : "Connect"}
        </button>
      </div>
    </>
  );
}

export { NavBar };

