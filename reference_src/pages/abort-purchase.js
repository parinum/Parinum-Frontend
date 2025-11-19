import { useState } from "react";
import { initProvider, abortPurchase } from "../lib/functions.js";
import {NavBar} from "../components/NavBar";
import { useRouter } from 'next/navigation';
import { Tooltip } from 'react-tooltip';
import InfoIcon from '../icons/InfoIcon';
import 'react-tooltip/dist/react-tooltip.css';


export default function AbortPurchase() {
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
      await abortPurchase(purchaseId);
      setMessage("Purchase aborted successfully!");
    } catch (error) {
      setMessage(`Error: ${error.message}`);
    }
  };

  return (
    <>
    <NavBar />
    <div className="transaction-bar">
        <button onClick={() => navigateTo("/create-purchase")}>Create</button>
        <button className="active" onClick={() => navigateTo("/abort-purchase")}>Abort</button>
        <button onClick={() => navigateTo("/confirm-purchase")}>Confirm</button>
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
                data-tooltip-id="abort-info"
                data-tooltip-content="Aborting a purchase will cancel the transaction and refund both the collateral and price to their respective parties. This action cannot be undone."
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
            <Tooltip id="abort-info" />
          </div>
          <button type="submit">Abort</button>
        </form>
        {message && <p className="message">{message}</p>}
      </div>
    </div>
    </>
  );
}