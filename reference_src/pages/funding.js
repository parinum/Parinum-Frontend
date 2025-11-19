import { useState } from "react";
import { buyTokens, calculateIcoPrice, claimTokens, getIcoInfo } from "../lib/functions.js";
import { NavBar } from "../components/NavBar";
import { useEffect } from "react";

export default function BuyPSFTokens() {
    const [amount, setAmount] = useState("");
    const [referer, setReferer] = useState("");
    const [price, setPrice] = useState("");
    const [poolETH, setPoolETH] = useState(0n);
    const [poolPSC, setPoolPSC] = useState(0n);
    const [deploymentTime, setDeploymentTime] = useState(0n);
    const [timeLimit, setTimeLimit] = useState(0n);
    const [soldAmount, setSoldAmount] = useState(0n);

    const handleSubmit = async () => {
        try {
            const purchaseLogs = await buyTokens(referer, amount);
        } catch (error) {
            console.log(`Error: ${error.message}`);
        }
    }

    async function fetchIcoInfo() {
        try {
            let { poolETH, poolPSC, deploymentTime, timeLimit, soldAmount } = await getIcoInfo();
            setPoolETH(poolETH);
            setPoolPSC(poolPSC);
            setDeploymentTime(deploymentTime);
            setTimeLimit(timeLimit);
            setSoldAmount(soldAmount);
        } catch (error) {
            console.log(`Error: ${error.message}`);
        }
    }

    useEffect(() => {
        fetchIcoInfo();
    }, []);

    return (
        <>
            <NavBar />
            <h2>Participate in ICO.</h2>
            <h3>Buy PSC with ETH, then claim tokens once ICO has ended.</h3>
            <div className="page-container">
                <form onSubmit={(e) => {
                    e.preventDefault();
                    handleSubmit(referer, amount)
                }}>
                    <div className="grid-container">
                        <div className='grid-item'>
                            <div className="form-group">
                                <label>Amount (ETH)</label>
                                <input
                                    placeholder="0"
                                    type="number"
                                    value={amount}
                                    onChange={(e) => {
                                        setAmount(e.target.value)
                                        setPrice(calculateIcoPrice(e.target.value))
                                    }}
                                />
                            </div>
                        </div>
                        <div className='grid-item'>
                            <div className="form-group">
                                <label>Amount (PSC)</label>
                                <div className="amount-message">
                                    <a>{price}</a>
                                </div>
                            </div>
                        </div>
                        </div>

                        <div className="form-group">
                            <label>Referer</label>
                            <br />
                            <input
                                placeholder="0x1234567890abcdef1234567890abcdef12345678"
                                className="addressInput"
                                type="text"
                                value={referer}
                                onChange={(e) => setReferer(e.target.value)}
                            />
                        </div>
                        <button type="submit">Buy Tokens</button>
                </form>
                <div className="form-group">
                    <label>Further Information</label>
                    <div className="message">
                        <p>PSC tokens can be claimed at the end of the ICO</p>
                    </div>
                </div>
                <button onClick={() => { claimTokens() }}>Claim Tokens</button>
            </div>
            <div className="page-container">
                <form className="grid-container">
                    <div className="grid-item">
                        <label>Amount Sold</label>
                        <h2>{soldAmount.toString()}</h2>
                    </div>
                    <div className="grid-item">
                        <label>Time Left</label>
                        <h2>
                            {(() => {
                                const secondsLeft = deploymentTime + timeLimit - BigInt(Math.floor(Date.now() / 1000));
                                const days = secondsLeft / BigInt(86400);
                                const hours = (secondsLeft % BigInt(86400)) / BigInt(3600);
                                return `${days} days and ${hours} hours`;
                            })()}
                        </h2>
                    </div>
                    <div className="grid-item">
                        <label>Available PSC</label>
                        <h2>{poolPSC.toString()}</h2>
                    </div>
                    <div className="grid-item">
                        <label>ETH Raised</label>
                        <h2>{poolETH.toString()}</h2>
                    </div>
                </form>
            </div>
        </>
    );
}