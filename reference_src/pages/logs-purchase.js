// app/create-purchase/page.js

import { useState } from "react";
import { getPurchaseLogs } from "../lib/functions.js";
import {NavBar} from "../components/NavBar";
import { useRouter } from 'next/navigation';
import { Tooltip } from 'react-tooltip';
import InfoIcon from '../icons/InfoIcon';
import 'react-tooltip/dist/react-tooltip.css';

export default function GetLogs() {
  const router = useRouter();
  const navigateTo = (path) => {
    router.push(path);
  };

  const [account, setAccount] = useState("");
  const [logs, setLogs] = useState({resolvedBuyCount: 0, unresolvedBuyCount: 0, resolvedSellCount: 0, unresolvedSellCount: 0, totalVolume: 0});
  const [logsLoaded, setLogsLoaded] = useState(false);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const purchaseLogs = await getPurchaseLogs(account);
      const resolvedBuyCount = purchaseLogs.resolvedBuyLogs.length;
      const unresolvedBuyCount = purchaseLogs.unresolvedBuyLogs.length;
      const resolvedSellCount = purchaseLogs.resolvedSellLogs.length;
      const unresolvedSellCount = purchaseLogs.unresolvedSellLogs.length;
      const totalVolume = purchaseLogs.totalVolume;
      setLogs({resolvedBuyCount: resolvedBuyCount, unresolvedBuyCount: unresolvedBuyCount, resolvedSellCount: resolvedSellCount, unresolvedSellCount: unresolvedSellCount, totalVolume: totalVolume});
      setLogsLoaded(true);
    } catch (error) {
      console.log(`Error: ${error.message}`);
    }
  };

  return (
    <>
    <NavBar />
    <div className="transaction-bar">
        <button onClick={() => navigateTo("/create-purchase")}>Create</button>
        <button onClick={() => navigateTo("/abort-purchase")}>Abort</button>
        <button onClick={() => navigateTo("/confirm-purchase")}>Confirm</button>
        <button onClick={() => navigateTo("/release-purchase")}>Release</button>
        <button className="active" onClick={() => navigateTo("/logs-purchase")}>Logs</button>
    </div>
    <div className="page-container">
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>
              Account Address
              <span
                data-tooltip-id="account-address-tooltip"
                data-tooltip-content="Find historical activity of this wallet."
                style={{ marginLeft: '8px', cursor: 'pointer' }}
              >
                <InfoIcon />
              </span>
            </label>
            <br />
            <input
              className="addressInput"
              type="text"
              value={account}
              onChange={(e) => setAccount(e.target.value)}
            />
            <Tooltip id="account-address-tooltip" />
          </div>
          <button type="submit">Get History</button>
        </form>
    </div>
    <div className="page-container">
      <form className="grid-container">
        <div className="grid-item">
          <label>
            Resolved Buys
            <span
              data-tooltip-id="resolved-buys-tooltip"
              data-tooltip-content="Number of completed purchases where this address was the buyer and successfully received the goods."
              style={{ marginLeft: '8px', cursor: 'pointer' }}
            >
              <InfoIcon />
            </span>
          </label>
          <h2>{logs.resolvedBuyCount}</h2>
          <Tooltip id="resolved-buys-tooltip" />
        </div>
        <div className="grid-item">
          <label>
            Unresolved Buys
            <span
              data-tooltip-id="unresolved-buys-tooltip"
              data-tooltip-content="Number of purchases where this address was the buyer but the transaction was not completed or is still pending."
              style={{ marginLeft: '8px', cursor: 'pointer' }}
            >
              <InfoIcon />
            </span>
          </label>
          <h2>{logs.unresolvedBuyCount - logs.resolvedBuyCount}</h2>
          <Tooltip id="unresolved-buys-tooltip" />
        </div>
        <div className="grid-item">
          <label>
            Resolved Sells
            <span
              data-tooltip-id="resolved-sells-tooltip"
              data-tooltip-content="Number of completed sales where this address was the seller and successfully received payment."
              style={{ marginLeft: '8px', cursor: 'pointer' }}
            >
              <InfoIcon />
            </span>
          </label>
          <h2>{logs.resolvedSellCount}</h2>
          <Tooltip id="resolved-sells-tooltip" />
        </div>
        <div className="grid-item">
          <label>
            Unresolved Sell
            <span
              data-tooltip-id="unresolved-sells-tooltip"
              data-tooltip-content="Number of sales where this address was the seller but the transaction was not completed or is still pending."
              style={{ marginLeft: '8px', cursor: 'pointer' }}
            >
              <InfoIcon />
            </span>
          </label>
          <h2>{logs.unresolvedSellCount - logs.resolvedSellCount}</h2>
          <Tooltip id="unresolved-sells-tooltip" />
        </div>
        <div className="grid-item">
          <label>
            Total Resolved
            <span
              data-tooltip-id="total-resolved-tooltip"
              data-tooltip-content="Total number of successfully completed transactions (both buying and selling) for this address."
              style={{ marginLeft: '8px', cursor: 'pointer' }}
            >
              <InfoIcon />
            </span>
          </label>
          <h2>{logs.resolvedBuyCount + logs.resolvedSellCount}</h2>
          <Tooltip id="total-resolved-tooltip" />
        </div>
        <div className="grid-item">
          <label>
            Total Unresolved
            <span
              data-tooltip-id="total-unresolved-tooltip"
              data-tooltip-content="Total number of incomplete or pending transactions (both buying and selling) for this address."
              style={{ marginLeft: '8px', cursor: 'pointer' }}
            >
              <InfoIcon />
            </span>
          </label>
          <h2>{logs.unresolvedBuyCount + logs.unresolvedSellCount - logs.resolvedBuyCount - logs.resolvedSellCount}</h2>
          <Tooltip id="total-unresolved-tooltip" />
        </div>
        <div className="grid-item">
          <label>
            Resolution Rate
            <span
              data-tooltip-id="resolution-rate-tooltip"
              data-tooltip-content="Percentage of transactions that were successfully completed. Higher rates indicate more reliable trading activity."
              style={{ marginLeft: '8px', cursor: 'pointer' }}
            >
              <InfoIcon />
            </span>
          </label>
          <h2>{(100 * (logs.resolvedBuyCount + logs.resolvedSellCount) / (logs.unresolvedBuyCount + logs.unresolvedSellCount)).toString() + "%"}</h2>
          <Tooltip id="resolution-rate-tooltip" />
        </div>
        <div className="grid-item">
          <label>
            ETH Volume
            <span
              data-tooltip-id="eth-volume-tooltip"
              data-tooltip-content="Total value in ETH of all transactions (both resolved and unresolved) associated with this address."
              style={{ marginLeft: '8px', cursor: 'pointer' }}
            >
              <InfoIcon />
            </span>
          </label>
          <h2>{((logs.totalVolume? logs.totalVolume : 0)).toString()}</h2>
          <Tooltip id="eth-volume-tooltip" />
        </div>
      </form>
    </div>
    </>
  );
}