import { useState } from "react";
import { initProvider, releasePurchase } from "../lib/functions.js";
import { NavBar } from "../components/NavBar";
import { useRouter } from 'next/navigation';
import { Tooltip } from 'react-tooltip';
import InfoIcon from '../icons/InfoIcon';
import 'react-tooltip/dist/react-tooltip.css';

export default function ReleasePurchase() {
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
            await releasePurchase(purchaseId);
            setMessage("Purchase released successfully!");
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
                <button onClick={() => navigateTo("/confirm-purchase")}>Confirm</button>
                <button className="active" onClick={() => navigateTo("/release-purchase")}>Release</button>
                <button onClick={() => navigateTo("/logs-purchase")}>Logs</button>
            </div>
            <div className="container">
                <div className="page-container">
                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label>
                                Purchase ID
                                <span
                                    data-tooltip-id="release-info"
                                    data-tooltip-content="Only buyers can release purchases. Both parties receive their collateral back and the price amount is sent to the seller."
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
                            <Tooltip id="release-info" />
                        </div>
                        <button type="submit">Release</button>
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