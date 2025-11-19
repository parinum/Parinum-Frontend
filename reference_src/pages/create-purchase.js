import { useState, useEffect, useRef } from "react";
import { initProvider, createPurchase } from "../lib/functions.js";
import { NavBar } from "../components/NavBar";
import { useRouter } from 'next/navigation';
import { Tooltip } from 'react-tooltip';
import InfoIcon from '../icons/InfoIcon';
import 'react-tooltip/dist/react-tooltip.css';

export default function CreatePurchase() {
  const [seller, setSeller] = useState("");
  const [price, setPrice] = useState("");
  const [collateral, setCollateral] = useState("");
  const [tokenAddress, setTokenAddress] = useState("");
  const [message, setMessage] = useState("Create Purchase for ID");
  const [open, setOpen] = useState(false);
  const [tokenText, setTokenText] = useState("Select Token");

  const router = useRouter();
  const navigateTo = (path) => {
    router.push(path);
  };

  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await initProvider();
      const purchaseAddress = await createPurchase(seller, price, collateral, tokenAddress);
      setMessage("Purchase ID: " + purchaseAddress);
    } catch (error) {
      console.log(`Error: ${error.message}`);
    }
  };

  return (
    <>
      <NavBar />
      <div className="transaction-bar">
        <button className="active" onClick={() => navigateTo("/create-purchase")}>Create</button>
        <button onClick={() => navigateTo("/abort-purchase")}>Abort</button>
        <button onClick={() => navigateTo("/confirm-purchase")}>Confirm</button>
        <button onClick={() => navigateTo("/release-purchase")}>Release</button>
        <button onClick={() => navigateTo("/logs-purchase")}>Logs</button>
      </div>
      <div className="page-container">
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="jsx-4ba9a3a078bfe161">
              Seller Address
              <span
                data-tooltip-id="seller-address-info"
                data-tooltip-content="The seller address is the Ethereum address of the seller. It is used to identify the recipient of the funds in the transaction."
                style={{ marginLeft: '8px', cursor: 'pointer' }}
              >
                <InfoIcon />
              </span>
            </label>
            <br className="jsx-4ba9a3a078bfe161" />
            <input
              className="addressInput"
              type="text"
              value={seller}
              placeholder="0x1234567890abcdef1234567890abcdef12345678"
              onChange={(e) => setSeller(e.target.value)}
            />
            <Tooltip id="seller-address-info" />
          </div>
          <div className="form-group">
            <label>
              Token Address
              <span
                data-tooltip-id="token-address-info"
                data-tooltip-content="The ERC20 token address is the unique identifier for the token contract on the Ethereum blockchain. It is used to specify the token involved in the transaction."
                style={{ marginLeft: '8px', cursor: 'pointer' }}
              >
                <InfoIcon />
              </span>
            </label>
            <br />

            <div className="dropdown" ref={dropdownRef} style={{ position: "relative" }}>
              <label onClick={() => setOpen(!open)} style={{ cursor: "pointer" }}>
                {tokenText}
              </label>
              <div
                className={`dropdown-content ${open ? "open" : "closed"}`}
                style={{
                  position: "absolute",
                  top: "100%",
                  left: -5,
                  zIndex: 1000,
                  backgroundColor: "#0c1624",
                  border: "5px solid rgb(50, 68, 94)",
                  borderRadius: "20px",
                  width: "100%",
                  transition: open ? "max-height 0.3s ease-in-out, opacity 0.3s cubic-bezier(0, 1, 0, 1)" : "max-height 0.3s ease-in-out, opacity 0.3s cubic-bezier(1, 0, 1, 0)",
                  maxHeight: open ? "200px" : "0",
                  opacity: open ? 1 : 0,
                  overflowY: open ? "auto" : "hidden",
                }}
              >
                <button onClick={() => {
                  setTokenAddress("0");
                  setTokenText("ETH");
                  setOpen(false);
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "0px 0px" }}>
                    <img className="coinIcon" src="/eth.png" alt="ETH" width="20" height="20" />
                    <span>ETH</span>
                  </div>
                </button>
                <button onClick={() => {
                  setTokenAddress("0x6b175474e89094c44da98b954eedeac495271d0f");
                  setTokenText("DAI");
                  setOpen(false);
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "0px 0px" }}>
                    <img className="coinIcon" src="/dai.png" alt="DAI" width="20" height="20" />
                    <span>DAI</span>
                  </div>
                </button>
                <button onClick={() => {
                  setTokenAddress("0x2260fac5e5542a773aa44fbcfedf7c193bc2c599");
                  setTokenText("WBTC");
                  setOpen(false);
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "0px 0px" }}>
                    <img className="coinIcon" src="/btc.png" alt="WBTC" width="20" height="20" />
                    <span>WBTC</span>
                  </div>
                </button>
                <button onClick={() => {
                  setTokenAddress("0x514910771af9ca656af840dff83e8264ecf986ca");
                  setTokenText("USDC");
                  setOpen(false);
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "0px 0px" }}>
                    <img className="coinIcon" src="/usdc.png" alt="LINK" width="20" height="20" />
                    <span>USDC</span>
                  </div>
                </button>
                <div style={{ padding: "4px 12px" }}>
                  <input
                    type="text"
                    placeholder="Enter custom ERC20 token address"
                    onChange={(e) => {
                      const value = e.target.value;
                      setTokenAddress(value);
                      setTokenText(tokenAddress ? value : "Select Token");
                    }}
                    style={{ width: "100%", padding: "6px", fontSize: "14px" }}
                  />
                </div>
              </div>
            </div>
            <Tooltip id="token-address-info" />
          </div>
          <div className="form-group">
            <label>
              Price
              <span
                data-tooltip-id="price-info"
                data-tooltip-content="The price is the amount at which the product is sold."
                style={{ marginLeft: '8px', cursor: 'pointer' }}
              >
                <InfoIcon />
              </span>
            </label>
            <br />
            <input
              type="number"
              value={price}
              placeholder="0"
              onChange={(e) => setPrice(e.target.value)}
            />
            <Tooltip id="price-info" />
          </div>
          <div className="form-group">
            <label>
              Collateral
              <span
                data-tooltip-id="collateral-info"
                data-tooltip-content="The collateral is the amount locked up to ensure a safe transaction."
                style={{ marginLeft: '8px', cursor: 'pointer' }}
              >
                <InfoIcon />
              </span>
            </label>
            <br />
            <input
              type="number"
              value={collateral}
              placeholder="0"
              onChange={(e) => setCollateral(e.target.value)}
            />
            <Tooltip id="collateral-info" />
          </div>
          <div className="form-group">
            <label>
              Purchase ID
              <span
                data-tooltip-id="purchase-id-info"
                data-tooltip-content="The Purchase ID is a unique identifier generated when a purchase is created. It represents the smart contract address for this specific transaction."
                style={{ marginLeft: '8px', cursor: 'pointer' }}
              >
                <InfoIcon />
              </span>
            </label>
            <div className="message addressInput">
              <p>{message}</p>
            </div>
            <Tooltip id="purchase-id-info" />
          </div>
          <button type="submit">Create</button>
        </form>
      </div>
      <style jsx>{`
        .dropdown-content {
          will-change: max-height, opacity;
        }
      `}</style>
    </>
  );
}