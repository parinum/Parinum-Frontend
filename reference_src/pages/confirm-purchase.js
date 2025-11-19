import { useState } from "react";
import { initProvider, confirmPurchase } from "../lib/functions.js";
import { NavBar } from "../components/NavBar";
import { useRouter } from 'next/navigation';
import { Tooltip } from 'react-tooltip';
import InfoIcon from '../icons/InfoIcon';
import 'react-tooltip/dist/react-tooltip.css';


export default function ConfirmPurchase() {
  const [purchaseId, setPurchaseId] = useState("");
  const [message, setMessage] = useState("");

  const router = useRouter();
  const navigateTo = (path) => {
    router.push(path);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await initProvider();
      await confirmPurchase(purchaseId);
      setMessage("Purchase confirmed successfully!");
    } catch (error) {
      setMessage(`Error: ${error.message}`);
    }
  };

  return (
    <>
    <NavBar />
    <div className="transaction-bar">
        <button onClick={() => navigateTo("/create-purchase")}>Create</button>
        <button onClick={() => navigateTo("/abort-purchase")}>Abort</button>
        <button className="active" onClick={() => navigateTo("/confirm-purchase")}>Confirm</button>
        <button onClick={() => navigateTo("/release-purchase")}>Release</button>
        <button onClick={() => navigateTo("/logs-purchase")}>Logs</button>
    </div>
    <div className="container">
      <div className="page-container">
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>
              Purchase ID
              <span
                data-tooltip-id="confirm-info"
                data-tooltip-content="Only sellers can confirm purchases. The seller sends the collateral amount, and only receives the funds after the buyer confirms receipt of goods."
                style={{ marginLeft: '8px', cursor: 'pointer' }}
              >
                <InfoIcon />
              </span>
            </label>
            <br />
            <input
              className="addressInput"
              type="text"
              value={purchaseId}
              onChange={(e) => setPurchaseId(e.target.value)}
            />
            <Tooltip id="confirm-info" />
          </div>
          <button type="submit">Confirm</button>
        </form>
        {message && 
        <div className="form-group">
          <a className="message">{message}</a>
        </div>
        }
      </div>
    </div>
    </>
  );
}